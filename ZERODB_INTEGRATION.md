# ZeroDB Integration Guide

Complete guide to integrating ZeroDB vector database and FREE embeddings into your Next.js documentation search application.

---

## Table of Contents

1. [Introduction](#introduction)
2. [What is ZeroDB?](#what-is-zerodb)
3. [Getting Started](#getting-started)
4. [Authentication](#authentication)
5. [Embeddings API](#embeddings-api)
6. [Vector Search](#vector-search)
7. [Namespaces](#namespaces)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Performance Optimization](#performance-optimization)
11. [Advanced Features](#advanced-features)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)

---

## Introduction

This guide covers everything you need to integrate ZeroDB into your application. ZeroDB is a managed vector database platform that provides:

- 🆓 **FREE Embeddings** - BAAI/bge-small-en-v1.5 (384 dimensions)
- 🚀 **Auto-Embedding Search** - No manual embedding generation
- 🔐 **Secure Authentication** - JWT-based token system
- 📦 **Managed Infrastructure** - No database setup required
- 🌐 **Simple REST API** - Works with any HTTP client

---

## What is ZeroDB?

ZeroDB is a managed vector database platform designed for AI applications. Unlike traditional vector databases that require separate embedding services, ZeroDB provides:

### Unified Platform

```
┌───────────────────────────────────────┐
│           ZeroDB Platform              │
│                                        │
│  ┌─────────────┐   ┌────────────────┐│
│  │   Vector    │   │  FREE         ││
│  │   Storage   │   │  Embeddings   ││
│  └─────────────┘   └────────────────┘│
│                                        │
│  ┌─────────────┐   ┌────────────────┐│
│  │  Semantic   │   │  REST API      ││
│  │  Search     │   │  Access        ││
│  └─────────────┘   └────────────────┘│
└───────────────────────────────────────┘
```

### Key Features

1. **Automatic Embeddings** - Send text, get vectors automatically
2. **Semantic Search** - Query with plain text, no embedding step
3. **Namespace Organization** - Organize vectors by category
4. **Metadata Filtering** - Filter results by custom metadata
5. **Managed Infrastructure** - No setup, scaling, or maintenance
6. **Free Tier** - Generous free tier for development

---

## Getting Started

### Step 1: Create ZeroDB Account

1. Visit [ainative.studio/dashboard](https://ainative.studio/dashboard)
2. Sign up with email + password (no credit card)
3. Verify your email

### Step 2: Create Project

1. Click **"New Project"**
2. Name your project (e.g., "Doc Search")
3. Enable **"Vector Database"** feature
4. Copy your **Project ID**

### Step 3: Get Credentials

You'll need:
- **Project ID**: From dashboard (e.g., `f3bd73fe-8e0b-42b7...`)
- **Email**: Your AINative account email
- **Password**: Your AINative account password

### Step 4: Configure Environment

```env
ZERODB_API_URL=https://api.ainative.studio
ZERODB_PROJECT_ID=your-project-id-here
ZERODB_EMAIL=your-email@example.com
ZERODB_PASSWORD=your-password
```

---

## Authentication

ZeroDB uses JWT (JSON Web Token) authentication. You must authenticate before making API calls.

### Authentication Flow

```
1. POST /v1/public/auth/login
   ↓
2. Receive access_token (JWT)
   ↓
3. Include token in all API requests
   ↓
4. Token expires after 24 hours
   ↓
5. Re-authenticate when needed
```

### Implementation

```typescript
interface ZeroDBAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function authenticateZeroDB(): Promise<string> {
  const response = await fetch(
    `${process.env.ZERODB_API_URL}/v1/public/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        username: process.env.ZERODB_EMAIL!,
        password: process.env.ZERODB_PASSWORD!
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Authentication failed: ${error}`);
  }

  const data: ZeroDBAuthResponse = await response.json();
  return data.access_token;
}
```

### Token Caching

For better performance, cache the token:

```typescript
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // Authenticate and cache new token
  cachedToken = await authenticateZeroDB();
  tokenExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours

  return cachedToken;
}
```

### Error Handling

```typescript
try {
  const token = await authenticateZeroDB();
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Invalid credentials');
  } else if (error.message.includes('timeout')) {
    console.error('Network timeout');
  } else {
    console.error('Authentication error:', error);
  }
}
```

---

## Embeddings API

ZeroDB provides two main embedding endpoints:

1. **embed-and-store** - Generate embeddings and store vectors
2. **search** - Search vectors with auto-embedding from text

### Embed and Store

Store documents with automatic embedding generation:

```typescript
interface EmbedAndStoreRequest {
  documents: Array<{
    id: string;           // Unique document ID
    text: string;         // Document text (ZeroDB generates embedding)
    metadata?: object;    // Optional metadata
  }>;
  namespace: string;      // Namespace for organization
  model?: string;         // Embedding model (default: BAAI/bge-small-en-v1.5)
  upsert?: boolean;       // Update if exists (default: false)
}

interface EmbedAndStoreResponse {
  embedded_count: number;
  namespace: string;
  model: string;
}

async function embedAndStore(
  documents: Array<{ id: string; text: string; metadata?: object }>,
  namespace: string,
  accessToken: string
): Promise<EmbedAndStoreResponse> {
  const response = await fetch(
    `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        documents,
        namespace,
        model: 'BAAI/bge-small-en-v1.5',  // FREE embeddings
        upsert: true  // Update if ID exists
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embed-and-store failed: ${error}`);
  }

  return response.json();
}
```

### Example: Store Documentation

```typescript
const accessToken = await authenticateZeroDB();

// Prepare documents
const documents = [
  {
    id: 'doc_getting_started',
    text: 'Getting Started with ZeroDB. Install the package...',
    metadata: {
      title: 'Getting Started',
      category: 'tutorial',
      url: '/docs/getting-started'
    }
  },
  {
    id: 'doc_api_reference',
    text: 'API Reference. The embeddings API allows you to...',
    metadata: {
      title: 'API Reference',
      category: 'reference',
      url: '/docs/api'
    }
  }
];

// Store with automatic embeddings
const result = await embedAndStore(
  documents,
  'documentation',
  accessToken
);

console.log(`Embedded ${result.embedded_count} documents`);
// Output: Embedded 2 documents
```

### Batch Processing

For large document sets, process in batches:

```typescript
async function batchEmbedAndStore(
  allDocuments: Array<{ id: string; text: string; metadata?: object }>,
  namespace: string,
  batchSize: number = 10
): Promise<void> {
  const accessToken = await authenticateZeroDB();

  for (let i = 0; i < allDocuments.length; i += batchSize) {
    const batch = allDocuments.slice(i, i + batchSize);

    console.log(`Processing batch ${i / batchSize + 1}...`);

    await embedAndStore(batch, namespace, accessToken);

    // Optional: delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('All documents embedded!');
}
```

---

## Vector Search

ZeroDB's semantic search API automatically generates embeddings from your query text.

### Search API

```typescript
interface SemanticSearchRequest {
  query: string;             // Plain text query (ZeroDB generates embedding)
  limit?: number;            // Max results (default: 10)
  threshold?: number;        // Similarity threshold 0-1 (default: 0.7)
  namespace?: string;        // Namespace to search
  model?: string;            // Embedding model (must match stored docs)
  filter_metadata?: object;  // Filter by metadata
  include_metadata?: boolean;// Include metadata in results (default: true)
}

interface SearchResult {
  id: string;
  score: number;      // Similarity score 0-1
  text?: string;      // Document text
  document?: string;  // Alternative field for text
  metadata?: object;  // Document metadata
}

interface SearchResponse {
  results: SearchResult[];
  total?: number;
  query?: string;
}

async function semanticSearch(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    namespace?: string;
  } = {},
  accessToken: string
): Promise<SearchResult[]> {
  const response = await fetch(
    `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query,  // Plain text - ZeroDB generates embedding automatically!
        limit: options.limit || 5,
        threshold: options.threshold || 0.7,
        namespace: options.namespace || 'documentation',
        model: 'BAAI/bge-small-en-v1.5',
        include_metadata: true
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search failed: ${error}`);
  }

  const data: SearchResponse = await response.json();
  return data.results;
}
```

### Example: Search Documentation

```typescript
const accessToken = await authenticateZeroDB();

// Search with plain text
const results = await semanticSearch(
  'How do I authenticate with the API?',
  {
    limit: 5,
    threshold: 0.7,
    namespace: 'documentation'
  },
  accessToken
);

console.log(`Found ${results.length} relevant documents:`);

results.forEach((result, i) => {
  console.log(`\n${i + 1}. Score: ${result.score.toFixed(2)}`);
  console.log(`   Text: ${result.text?.substring(0, 100)}...`);
  console.log(`   Metadata:`, result.metadata);
});
```

### Output Example

```
Found 3 relevant documents:

1. Score: 0.89
   Text: Authentication with ZeroDB uses JWT tokens. First, call the login endpoint...
   Metadata: { title: 'Authentication', category: 'guide', url: '/docs/auth' }

2. Score: 0.82
   Text: The API requires an access token. Include it in the Authorization header...
   Metadata: { title: 'API Reference', category: 'reference', url: '/docs/api' }

3. Score: 0.76
   Text: Security best practices for ZeroDB. Always store credentials securely...
   Metadata: { title: 'Security', category: 'guide', url: '/docs/security' }
```

### Filtering by Metadata

Search with metadata filters:

```typescript
const results = await fetch(/* ... */, {
  body: JSON.stringify({
    query: 'deployment guide',
    limit: 5,
    threshold: 0.7,
    namespace: 'documentation',
    filter_metadata: {
      category: 'tutorial',      // Only tutorials
      difficulty: 'beginner'     // Only beginner level
    }
  })
});
```

---

## Namespaces

Namespaces organize vectors into logical groups. Think of them as "folders" for your vectors.

### Why Use Namespaces?

1. **Organization** - Separate different content types
2. **Performance** - Search only relevant vectors
3. **Multi-Tenancy** - Isolate data per user/tenant
4. **Testing** - Separate dev/staging/production data

### Namespace Examples

```typescript
// API documentation
await embedAndStore(apiDocs, 'api-reference', token);

// Tutorial guides
await embedAndStore(tutorials, 'tutorials', token);

// Blog posts
await embedAndStore(blogPosts, 'blog', token);

// User-specific data
await embedAndStore(userDocs, `user-${userId}`, token);
```

### Search Specific Namespace

```typescript
// Search only API docs
const apiResults = await semanticSearch(
  'authentication endpoint',
  { namespace: 'api-reference' },
  token
);

// Search only tutorials
const tutorialResults = await semanticSearch(
  'getting started',
  { namespace: 'tutorials' },
  token
);
```

### Multi-Namespace Search

To search across multiple namespaces, make parallel requests:

```typescript
async function searchMultipleNamespaces(
  query: string,
  namespaces: string[],
  token: string
): Promise<SearchResult[]> {
  // Search all namespaces in parallel
  const promises = namespaces.map(namespace =>
    semanticSearch(query, { namespace }, token)
  );

  const results = await Promise.all(promises);

  // Combine and sort by score
  return results
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);  // Top 10 overall
}

// Usage
const allResults = await searchMultipleNamespaces(
  'deployment',
  ['api-reference', 'tutorials', 'blog'],
  token
);
```

---

## Error Handling

Robust error handling is critical for production applications.

### Error Types

1. **Authentication Errors** (401)
2. **Authorization Errors** (403)
3. **Not Found** (404)
4. **Rate Limiting** (429)
5. **Server Errors** (500+)
6. **Network Errors** (timeout, connection refused)

### Comprehensive Error Handler

```typescript
class ZeroDBError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ZeroDBError';
  }
}

async function makeZeroDBRequest<T>(
  url: string,
  options: RequestInit,
  timeout: number = 15000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401) {
        throw new ZeroDBError(
          'Authentication failed. Check your credentials.',
          401,
          errorText
        );
      }

      if (response.status === 404) {
        throw new ZeroDBError(
          'Resource not found. Check project ID and namespace.',
          404,
          errorText
        );
      }

      if (response.status === 429) {
        throw new ZeroDBError(
          'Rate limit exceeded. Please try again later.',
          429,
          errorText
        );
      }

      if (response.status >= 500) {
        throw new ZeroDBError(
          'ZeroDB server error. Please try again.',
          response.status,
          errorText
        );
      }

      throw new ZeroDBError(
        `Request failed: ${errorText}`,
        response.status,
        errorText
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ZeroDBError(`Request timeout after ${timeout}ms`);
    }

    if (error instanceof ZeroDBError) {
      throw error;
    }

    throw new ZeroDBError(
      `Network error: ${error.message}`,
      undefined,
      error
    );
  }
}
```

### Retry Logic

Implement retry with exponential backoff:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry auth errors or client errors
      if (error instanceof ZeroDBError) {
        if (error.statusCode && error.statusCode < 500) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Usage
const results = await withRetry(() =>
  semanticSearch('query', {}, token)
);
```

---

## Best Practices

### 1. Token Management

Cache authentication tokens:

```typescript
class ZeroDBClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    this.token = await authenticateZeroDB();
    this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

    return this.token;
  }
}
```

### 2. Batch Operations

Process documents in batches:

```typescript
const BATCH_SIZE = 10;

async function processDocuments(documents: Document[]) {
  const token = await getAuthToken();

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await embedAndStore(batch, 'documentation', token);
  }
}
```

### 3. Checksum Validation

Skip unchanged documents:

```typescript
import { createHash } from 'crypto';

function calculateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('base64');
}

async function processIfChanged(
  document: Document,
  existingChecksums: Map<string, string>
) {
  const checksum = calculateChecksum(document.content);
  const existingChecksum = existingChecksums.get(document.id);

  if (checksum === existingChecksum) {
    console.log(`Skipping ${document.id} (unchanged)`);
    return;
  }

  await embedAndStore([document], 'documentation', token);
}
```

### 4. Proper Namespacing

Organize by content type:

```typescript
const NAMESPACES = {
  API_DOCS: 'api-reference',
  TUTORIALS: 'tutorials',
  BLOG: 'blog',
  CHANGELOG: 'changelog'
};

await embedAndStore(apiDocs, NAMESPACES.API_DOCS, token);
await embedAndStore(tutorials, NAMESPACES.TUTORIALS, token);
```

### 5. Metadata Enrichment

Add useful metadata:

```typescript
const documents = pages.map(page => ({
  id: page.id,
  text: page.content,
  metadata: {
    title: page.title,
    url: page.url,
    category: page.category,
    lastModified: page.updatedAt,
    author: page.author,
    tags: page.tags
  }
}));
```

### 6. Timeout Configuration

Set appropriate timeouts:

```typescript
const TIMEOUTS = {
  AUTH: 10000,      // 10s for authentication
  SEARCH: 15000,    // 15s for search
  EMBED: 30000      // 30s for embedding (large batches)
};
```

### 7. Environment-Specific Namespaces

Separate dev/staging/production:

```typescript
const namespace = `${process.env.NODE_ENV}-documentation`;
// dev-documentation, staging-documentation, production-documentation
```

---

## Performance Optimization

### 1. Parallel Requests

Process independent requests in parallel:

```typescript
// ❌ Sequential (slow)
const token = await authenticateZeroDB();
const results1 = await semanticSearch('query1', {}, token);
const results2 = await semanticSearch('query2', {}, token);

// ✅ Parallel (fast)
const token = await authenticateZeroDB();
const [results1, results2] = await Promise.all([
  semanticSearch('query1', {}, token),
  semanticSearch('query2', {}, token)
]);
```

### 2. Optimize Search Parameters

```typescript
// Balance precision and recall
const results = await semanticSearch(query, {
  limit: 5,        // Fewer results = faster
  threshold: 0.75  // Higher threshold = fewer results
}, token);
```

### 3. Text Preprocessing

Optimize text before embedding:

```typescript
function preprocessText(text: string): string {
  return text
    .replace(/\n/g, ' ')    // Replace newlines with spaces
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .trim()                 // Remove leading/trailing space
    .substring(0, 8000);    // Limit length (model limit)
}

const documents = rawDocs.map(doc => ({
  id: doc.id,
  text: preprocessText(doc.content),
  metadata: doc.metadata
}));
```

### 4. Connection Pooling

Reuse HTTP connections:

```typescript
import { Agent } from 'https';

const agent = new Agent({
  keepAlive: true,
  maxSockets: 10
});

const response = await fetch(url, {
  agent,  // Reuse connections
  // ...
});
```

### 5. Caching Strategy

Cache search results:

```typescript
const cache = new Map<string, { results: SearchResult[]; expiry: number }>();

async function cachedSearch(
  query: string,
  token: string,
  cacheTTL: number = 5 * 60 * 1000  // 5 minutes
): Promise<SearchResult[]> {
  const cached = cache.get(query);

  if (cached && Date.now() < cached.expiry) {
    return cached.results;
  }

  const results = await semanticSearch(query, {}, token);

  cache.set(query, {
    results,
    expiry: Date.now() + cacheTTL
  });

  return results;
}
```

---

## Advanced Features

### 1. Hybrid Search

Combine semantic and keyword search:

```typescript
async function hybridSearch(
  query: string,
  token: string
): Promise<SearchResult[]> {
  // Semantic search
  const semanticResults = await semanticSearch(query, {}, token);

  // Keyword filter (using metadata)
  const keywords = query.toLowerCase().split(' ');
  const filteredResults = semanticResults.filter(result =>
    keywords.some(keyword =>
      result.text?.toLowerCase().includes(keyword)
    )
  );

  return filteredResults;
}
```

### 2. Re-ranking

Re-rank results by custom logic:

```typescript
function reRankResults(
  results: SearchResult[],
  boostFactors: { [category: string]: number }
): SearchResult[] {
  return results
    .map(result => {
      const category = result.metadata?.category as string;
      const boost = boostFactors[category] || 1.0;

      return {
        ...result,
        score: result.score * boost
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Usage
const boostedResults = reRankResults(results, {
  'tutorial': 1.2,    // Boost tutorials
  'api-reference': 1.1,
  'blog': 0.9        // Downrank blog posts
});
```

### 3. Progressive Enhancement

Return results as they arrive:

```typescript
async function* streamingSearch(
  queries: string[],
  token: string
): AsyncGenerator<SearchResult[]> {
  for (const query of queries) {
    const results = await semanticSearch(query, {}, token);
    yield results;
  }
}

// Usage
for await (const results of streamingSearch(['q1', 'q2', 'q3'], token)) {
  console.log('Got results:', results);
  // Update UI incrementally
}
```

### 4. Feedback Loop

Improve results with user feedback:

```typescript
interface SearchFeedback {
  query: string;
  resultId: string;
  helpful: boolean;
}

async function recordFeedback(feedback: SearchFeedback) {
  // Store feedback for analytics
  // Use to improve search quality over time
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Authentication failed"

**Cause:** Invalid credentials

**Solution:**
```bash
# Test credentials
curl -X POST https://api.ainative.studio/v1/public/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_EMAIL&password=YOUR_PASSWORD"
```

#### 2. "No results returned"

**Causes:**
- Namespace mismatch
- No documents embedded
- Threshold too high

**Solutions:**
```typescript
// Check namespace
console.log('Searching namespace:', namespace);

// Lower threshold
const results = await semanticSearch(query, {
  threshold: 0.5  // Lower from 0.7
}, token);

// Verify documents exist
// Check dashboard: https://ainative.studio/dashboard
```

#### 3. "Request timeout"

**Cause:** Network issues or large batch

**Solutions:**
```typescript
// Increase timeout
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);  // 30s

// Reduce batch size
const BATCH_SIZE = 5;  // Down from 10
```

#### 4. "Rate limit exceeded"

**Cause:** Too many requests

**Solution:**
```typescript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 1000));

// Implement exponential backoff
await withRetry(() => semanticSearch(query, {}, token));
```

---

## API Reference

### Base URL

```
https://api.ainative.studio
```

### Endpoints

#### Authentication

```http
POST /v1/public/auth/login
Content-Type: application/x-www-form-urlencoded

username={email}&password={password}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

#### Embed and Store

```http
POST /v1/public/{project_id}/embeddings/embed-and-store
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "documents": [
    {
      "id": "doc_1",
      "text": "Document text...",
      "metadata": {}
    }
  ],
  "namespace": "documentation",
  "model": "BAAI/bge-small-en-v1.5",
  "upsert": true
}
```

**Response:**
```json
{
  "embedded_count": 1,
  "namespace": "documentation",
  "model": "BAAI/bge-small-en-v1.5"
}
```

#### Semantic Search

```http
POST /v1/public/{project_id}/embeddings/search
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "query": "search query",
  "limit": 5,
  "threshold": 0.7,
  "namespace": "documentation",
  "model": "BAAI/bge-small-en-v1.5",
  "filter_metadata": {},
  "include_metadata": true
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc_1",
      "score": 0.89,
      "text": "Document text...",
      "metadata": {}
    }
  ],
  "total": 1,
  "query": "search query"
}
```

### Rate Limits

- **Authentication**: 60 requests/minute
- **Search**: 1000 requests/minute
- **Embed-and-store**: 100 requests/minute

### Models

- **BAAI/bge-small-en-v1.5** (384D) - FREE, recommended
- More models coming soon

---

## Support

### Documentation

- [README.md](./README.md) - Quick start guide
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Migration guide
- [ZeroDB Docs](https://docs.ainative.studio) - Official documentation

### Get Help

- 🐛 [GitHub Issues](https://github.com/AINative-Studio/nextjs-openai-doc-search/issues)
- 💬 [Discord Community](https://discord.gg/ainative)
- 📧 [Email Support](mailto:support@ainative.studio)

---

**Happy building with ZeroDB!** 🚀
