# ZeroDB Platform Developer Guide

## 🎯 Overview

ZeroDB is AINative Studio's comprehensive intelligent database platform that unifies PostgreSQL, vector databases, and AI-powered data processing. Rather than separate ZeroGres, ZeroSQL, and ZeroML services, ZeroDB provides an integrated ecosystem with advanced capabilities.

**API Version:** v1  
**Status:** ✅ Production Ready  
**Base URL:** `https://api.ainative.studio`

## 🏗️ ZeroDB Architecture

ZeroDB combines multiple database technologies into a unified platform:

### Core Components
- **PostgreSQL Foundation**: Project-isolated PostgreSQL with pgvector extension
- **Vector Database**: High-performance vector storage and similarity search
- **Quantum Enhancement**: Quantum-inspired vector compression and scoring
- **Advanced Analytics**: ML-powered similarity metrics and semantic search
- **File Storage**: S3-compatible object storage via MinIO
- **Event Streaming**: Real-time data streaming with RedPanda
- **Memory Management**: AI agent memory and context management

## 🔑 Authentication

ZeroDB uses two primary authentication methods:

### 1. API Key Authentication (Recommended)
```bash
curl -H "X-API-Key: your_api_key_here" \
  https://api.ainative.studio/v1/public/projects
```

### 2. JWT Bearer Token Authentication
```bash
# Login first
curl -X POST https://api.ainative.studio/v1/public/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_email&password=your_password"

# Use token in subsequent requests
curl -H "Authorization: Bearer your_jwt_token_here" \
  https://api.ainative.studio/v1/public/projects
```

## 📊 Project Management API

### Create a Project
```bash
POST /v1/public/projects
Content-Type: application/json
X-API-Key: your_api_key

{
  "name": "My AI Project",
  "description": "AI-powered application",
  "tier": "pro",
  "database_enabled": true
}
```

### List Projects
```bash
GET /v1/public/projects?skip=0&limit=100
X-API-Key: your_api_key
```

### Get Project Details
```bash
GET /v1/public/{project_id}
X-API-Key: your_api_key
```

### Update Project
```bash
PATCH /v1/public/{project_id}
Content-Type: application/json
X-API-Key: your_api_key

{
  "name": "Updated Project Name",
  "tier": "scale"
}
```

### Delete Project
```bash
DELETE /v1/public/{project_id}
X-API-Key: your_api_key
```

**Note:** By default, projects are soft-deleted (can be restored). Use `?hard_delete=true` to permanently delete.

### Restore Deleted Project
```bash
POST /v1/public/projects/{project_id}/restore
X-API-Key: your_api_key
```

Restore a previously soft-deleted project. This endpoint:
- Changes project status back to `ACTIVE`
- Clears the `deleted_at` timestamp
- Only works on soft-deleted projects (not hard-deleted)

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Restored Project",
  "description": "AI-powered application",
  "tier": "pro",
  "status": "ACTIVE",
  "database_enabled": true,
  "deleted_at": null,
  "created_at": "2025-11-20T10:00:00Z",
  "updated_at": "2025-11-28T15:30:00Z"
}
```

### Get Projects Summary
```bash
GET /v1/public/projects/stats/summary
X-API-Key: your_api_key
```

Get aggregated statistics across all your projects. Useful for dashboard displays and usage monitoring.

**Response:**
```json
{
  "total_projects": 5,
  "projects_by_tier": {
    "free": 2,
    "pro": 2,
    "scale": 1
  },
  "total_usage": {
    "vectors_count": 50000,
    "tables_count": 25,
    "events_count": 1000000,
    "memory_usage_mb": 500,
    "storage_usage_mb": 2000
  },
  "active_projects": 4
}
```

**Use Cases:**
- Display total resource usage across all projects
- Monitor tier distribution
- Track active vs inactive projects
- Dashboard summary views

## 🗄️ Database Management API

### Enable Database for Project
```bash
POST /v1/public/{project_id}/database
X-API-Key: your_api_key
```

### Get Database Status
```bash
GET /v1/public/{project_id}/database
X-API-Key: your_api_key
```

### Update Database Configuration
```bash
PUT /v1/public/{project_id}/database
Content-Type: application/json
X-API-Key: your_api_key

{
  "vector_dimensions": 1536,
  "quantum_enabled": true
}
```

## 📋 Table Management API

### Create Table
```bash
POST /v1/public/{project_id}/database/tables
Content-Type: application/json
X-API-Key: your_api_key

{
  "name": "customer_data",
  "description": "Customer information table",
  "schema": {
    "id": "UUID PRIMARY KEY",
    "name": "TEXT NOT NULL",
    "email": "TEXT UNIQUE",
    "created_at": "TIMESTAMP DEFAULT NOW()"
  }
}
```

### List Tables
```bash
GET /v1/public/{project_id}/database/tables
X-API-Key: your_api_key
```

### Get Table Details
```bash
GET /v1/public/{project_id}/database/tables/{table_id}
X-API-Key: your_api_key
```

## 📊 Table Row Operations (CRUD)

### Create Row
```bash
POST /v1/public/{project_id}/database/tables/{table_name}/rows
Content-Type: application/json
X-API-Key: your_api_key

{
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### List Rows
```bash
GET /v1/public/{project_id}/database/tables/{table_name}/rows?skip=0&limit=100
X-API-Key: your_api_key
```

### Get Row
```bash
GET /v1/public/{project_id}/database/tables/{table_name}/rows/{row_id}
X-API-Key: your_api_key
```

### Update Row
```bash
PUT /v1/public/{project_id}/database/tables/{table_name}/rows/{row_id}
Content-Type: application/json
X-API-Key: your_api_key

{
  "data": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### Delete Row
```bash
DELETE /v1/public/{project_id}/database/tables/{table_name}/rows/{row_id}
X-API-Key: your_api_key
```

## 🔢 Vector Operations API

ZeroDB provides advanced vector operations with multiple backend options including PostgreSQL pgvector, Qdrant, and quantum-enhanced processing.

### Upsert Vector
```bash
POST /v1/public/{project_id}/database/vectors/upsert
Content-Type: application/json
X-API-Key: your_api_key

{
  "id": "doc_123",
  "vector": [0.1, 0.2, 0.3, ...],
  "metadata": {
    "document_type": "article",
    "title": "AI in Healthcare"
  },
  "namespace": "documents"
}
```

### Batch Upsert Vectors
```bash
POST /v1/public/{project_id}/database/vectors/upsert-batch
Content-Type: application/json
X-API-Key: your_api_key

{
  "vectors": [
    {
      "id": "doc_1",
      "vector": [0.1, 0.2, 0.3],
      "metadata": {"type": "article"}
    },
    {
      "id": "doc_2",
      "vector": [0.4, 0.5, 0.6],
      "metadata": {"type": "blog"}
    }
  ]
}
```

### Advanced Vector Search
```bash
POST /v1/public/{project_id}/database/vectors/search
Content-Type: application/json
X-API-Key: your_api_key

{
  "query_vector": [0.1, 0.2, 0.3, ...],
  "top_k": 10,
  "namespace": "documents",
  "filter": {
    "document_type": "article"
  },
  "similarity_metric": "cosine",  // cosine, euclidean, manhattan, etc.
  "quantum_enhanced": false,      // Enable quantum compression
  "hybrid_search": true          // Combine with keyword search
}
```

**Supported Similarity Metrics:**
- `cosine` - Cosine similarity (default)
- `euclidean` - Euclidean distance
- `manhattan` - Manhattan distance
- `dot_product` - Dot product
- `jaccard` - Jaccard index
- `hamming` - Hamming distance
- `pearson` - Pearson correlation
- `angular` - Angular distance

## 🧠 Memory Management API

### Store Memory
```bash
POST /v1/public/{project_id}/database/memory
Content-Type: application/json
X-API-Key: your_api_key

{
  "content": "User prefers technical documentation over tutorials",
  "metadata": {
    "user_id": "user_123",
    "session_id": "session_456",
    "importance": "high"
  },
  "tags": ["preference", "documentation"]
}
```

### Search Memory
```bash
POST /v1/public/{project_id}/database/memory/search
Content-Type: application/json
X-API-Key: your_api_key

{
  "query": "user preferences",
  "limit": 20
}
```

## 📁 File Operations API

### Upload File Metadata
```bash
POST /v1/public/{project_id}/database/files
Content-Type: application/json
X-API-Key: your_api_key

{
  "filename": "document.pdf",
  "size": 1024000,
  "content_type": "application/pdf",
  "metadata": {
    "category": "research",
    "tags": ["AI", "machine learning"]
  }
}
```

### List Files
```bash
GET /v1/public/{project_id}/database/files?skip=0&limit=100
X-API-Key: your_api_key
```

### Get File Metadata
```bash
GET /v1/public/{project_id}/database/files/{file_id}
X-API-Key: your_api_key
```

### Download File
```bash
GET /v1/public/{project_id}/database/files/{file_id}/download
X-API-Key: your_api_key
```

### Delete File
```bash
DELETE /v1/public/{project_id}/database/files/{file_id}
X-API-Key: your_api_key
```

### Generate Presigned URL
```bash
POST /v1/public/{project_id}/database/files/{file_id}/presigned-url
Content-Type: application/json
X-API-Key: your_api_key

{
  "expiration": 3600,
  "operation": "download"
}
```

### Get File Storage Statistics
```bash
GET /v1/public/{project_id}/database/files/stats
X-API-Key: your_api_key
```

## 📊 Event Operations API

### Publish Event
```bash
POST /v1/public/{project_id}/database/events
Content-Type: application/json
X-API-Key: your_api_key

{
  "event_type": "user_action",
  "data": {
    "action": "document_viewed",
    "user_id": "user_123",
    "document_id": "doc_456"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🎨 Embeddings API

Generate 384-dimension vector embeddings using our Railway-hosted HuggingFace embedding service. Perfect for semantic search, RAG applications, and AI-powered features.

**Model:** BAAI/bge-small-en-v1.5 (HuggingFace)
**Dimensions:** 384
**Performance:** < 100ms per text, batch processing available
**Cost:** FREE (self-hosted on Railway)

### Generate Embeddings

Generate vector embeddings from text without storing them. Useful for one-time comparisons or when you manage your own vector storage.

```bash
POST /v1/public/{project_id}/embeddings/generate
Content-Type: application/json
X-API-Key: your_api_key

{
  "texts": [
    "How to deploy a web application?",
    "Best practices for API security",
    "Introduction to machine learning"
  ],
  "model": "custom-1536"
}
```

**Response:**
```json
{
  "embeddings": [
    [0.123, -0.456, 0.789, ...],  // 384 dimensions
    [0.234, -0.567, 0.890, ...],  // 384 dimensions
    [0.345, -0.678, 0.901, ...]   // 384 dimensions
  ],
  "model": "BAAI/bge-small-en-v1.5",
  "dimensions": 384,
  "count": 3,
  "processing_time_ms": 42.5
}
```

### Embed and Store

Generate embeddings and automatically store them in your vector database with metadata. This is the recommended approach for building RAG systems.

```bash
POST /v1/public/{project_id}/embeddings/embed-and-store
Content-Type: application/json
X-API-Key: your_api_key

{
  "documents": [
    {
      "id": "doc_1",
      "text": "FastAPI is a modern web framework for building APIs with Python.",
      "metadata": {
        "category": "documentation",
        "source": "technical_docs",
        "tags": ["python", "api", "web"]
      }
    },
    {
      "id": "doc_2",
      "text": "Vector databases enable semantic search and similarity matching.",
      "metadata": {
        "category": "documentation",
        "source": "database_docs",
        "tags": ["database", "vectors", "search"]
      }
    }
  ],
  "namespace": "knowledge_base",
  "upsert": true
}
```

**Response:**
```json
{
  "success": true,
  "vectors_stored": 2,
  "embeddings_generated": 2,
  "model": "BAAI/bge-small-en-v1.5",
  "dimensions": 384,
  "namespace": "knowledge_base",
  "processing_time_ms": 156.7
}
```

### Semantic Search with Text

Search your vector database using natural language queries. The endpoint automatically generates embeddings from your query text and performs similarity search.

```bash
POST /v1/public/{project_id}/embeddings/search
Content-Type: application/json
X-API-Key: your_api_key

{
  "query": "How do I build REST APIs in Python?",
  "top_k": 5,
  "namespace": "knowledge_base",
  "filter": {
    "category": "documentation"
  },
  "similarity_threshold": 0.7,
  "include_metadata": true,
  "include_embeddings": false
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc_1",
      "score": 0.92,
      "text": "FastAPI is a modern web framework for building APIs with Python.",
      "metadata": {
        "category": "documentation",
        "source": "technical_docs",
        "tags": ["python", "api", "web"]
      }
    },
    {
      "id": "doc_3",
      "score": 0.85,
      "text": "Django REST framework provides powerful tools for building Web APIs.",
      "metadata": {
        "category": "documentation",
        "source": "technical_docs",
        "tags": ["python", "api", "django"]
      }
    }
  ],
  "query": "How do I build REST APIs in Python?",
  "total_results": 2,
  "model": "BAAI/bge-small-en-v1.5",
  "processing_time_ms": 98.3
}
```

### Embeddings API Examples

#### Python Example - RAG System
```python
from ainative import AINativeClient

client = AINativeClient(api_key="your_api_key")
project_id = "your_project_id"

# Store documents with embeddings
documents = [
    {
        "id": "faq_1",
        "text": "How do I reset my password? Click 'Forgot Password' on the login page.",
        "metadata": {"type": "faq", "category": "authentication"}
    },
    {
        "id": "faq_2",
        "text": "How do I upgrade my plan? Visit Settings > Billing > Change Plan.",
        "metadata": {"type": "faq", "category": "billing"}
    }
]

# Embed and store in one call
result = client.zerodb.embeddings.embed_and_store(
    project_id=project_id,
    documents=documents,
    namespace="customer_support"
)

print(f"Stored {result['stored_count']} documents")

# Search using natural language
search_results = client.zerodb.embeddings.search(
    project_id=project_id,
    query="I can't log in to my account",
    top_k=3,
    namespace="customer_support"
)

for result in search_results['results']:
    print(f"Score: {result['score']:.2f} - {result['text']}")
```

#### TypeScript Example - Semantic Search
```typescript
import { AINativeClient } from '@ainative/sdk';

const client = new AINativeClient({ apiKey: 'your_api_key' });
const projectId = 'your_project_id';

// Generate embeddings only
const embeddings = await client.zerodb.embeddings.generate(projectId, {
  texts: [
    'Machine learning fundamentals',
    'Deep learning neural networks',
    'Natural language processing'
  ]
});

console.log(`Generated ${embeddings.embeddings.length} embeddings`);
console.log(`Dimensions: ${embeddings.dimensions}`); // 384

// Semantic search with custom filtering
const searchResults = await client.zerodb.embeddings.search(projectId, {
  query: 'What is deep learning?',
  topK: 5,
  namespace: 'ml_docs',
  filter: { difficulty: 'beginner' },
  similarityThreshold: 0.75
});

searchResults.results.forEach(result => {
  console.log(`${result.score.toFixed(2)}: ${result.text}`);
});
```

### Embeddings API Parameters

#### Generate Embeddings
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `texts` | string[] | Yes | Array of texts to embed (max 100 per request) |
| `model` | string | No | Model name (default: "custom-1536") |

#### Embed and Store
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documents` | object[] | Yes | Documents with id, text, and optional metadata |
| `namespace` | string | No | Vector namespace (default: "default") |
| `upsert` | boolean | No | Update existing vectors (default: true) |

#### Semantic Search
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Natural language search query |
| `top_k` | number | No | Number of results (default: 10, max: 100) |
| `namespace` | string | No | Vector namespace to search |
| `filter` | object | No | Metadata filters |
| `similarity_threshold` | number | No | Min similarity score (0-1, default: 0.0) |
| `include_metadata` | boolean | No | Include metadata in results (default: true) |
| `include_embeddings` | boolean | No | Include vector embeddings (default: false) |

### Embeddings Best Practices

1. **Batch Processing**: Send up to 100 texts per request for better performance
2. **Namespaces**: Use namespaces to organize different document types
3. **Metadata**: Add rich metadata for better filtering and organization
4. **Caching**: Cache embeddings for frequently used texts
5. **Chunk Size**: Keep text chunks under 8,000 characters for optimal quality
6. **Similarity Threshold**: Use 0.7+ for high-quality matches, 0.5+ for exploratory search

### Embeddings vs OpenAI

| Feature | ZeroDB Embeddings | OpenAI Embeddings |
|---------|-------------------|-------------------|
| **Model** | BAAI/bge-small-en-v1.5 | text-embedding-ada-002 |
| **Dimensions** | 384 | 1536 |
| **Cost** | FREE (self-hosted) | $0.0001/1K tokens |
| **Performance** | < 100ms | ~200ms |
| **Integration** | Native ZeroDB storage | External vector DB needed |
| **Privacy** | Data stays in your project | Sent to OpenAI |
| **Hosting** | Railway (self-hosted) | OpenAI Cloud |

## 💾 SQL Query Execution API

Execute SQL queries directly against your dedicated PostgreSQL instance with built-in security validation.

### Execute SQL Query

```bash
POST /v1/public/{project_id}/database/query
Content-Type: application/json
X-API-Key: your_api_key

{
  "sql": "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '1 day'",
  "timeout_seconds": 30,
  "read_only": false,
  "max_rows": 100
}
```

**Response:**
```json
{
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "a9b717be-f449-43c6-abb4-18a1a6a0c70e",
  "query_type": "SELECT",
  "success": true,
  "execution_time_ms": 45.2,
  "rows_affected": 0,
  "rows_returned": 23,
  "columns": ["id", "email", "created_at"],
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "created_at": "2025-11-28T10:30:00Z"
    }
  ],
  "credits_consumed": 0.15
}
```

### Security Best Practices

The SQL query endpoint includes multiple security layers to protect your data:

1. **SQL Injection Prevention**
   - Automatic detection of SQL injection patterns
   - Blocks queries with suspicious patterns like `'; DROP TABLE`, `OR '1'='1'`, etc.
   - Validates query structure before execution

2. **Dangerous Command Blocking**
   - Prevents execution of dangerous commands:
     - `DROP DATABASE`, `DROP SCHEMA`
     - `TRUNCATE TABLE`
     - `ALTER SYSTEM`
     - `CREATE/DROP EXTENSION`
     - System function calls: `pg_read_file`, `pg_ls_dir`, etc.

3. **Timeout Enforcement**
   - Default timeout: 30 seconds
   - Maximum timeout: 5 minutes (300 seconds)
   - Prevents long-running queries from consuming resources

4. **Read-Only Mode**
   - Set `read_only: true` to allow only SELECT queries
   - Useful for analytics and reporting applications
   - Prevents accidental data modifications

5. **Rate Limiting**
   - 100 queries per minute per user
   - 500 queries per minute per project
   - Prevents abuse and ensures fair resource usage

### SQL Query Examples

#### SELECT Query
```bash
curl -X POST "https://api.ainative.studio/v1/public/projects/{project_id}/database/query" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT id, email, created_at FROM users WHERE active = true ORDER BY created_at DESC LIMIT 10",
    "timeout_seconds": 30,
    "read_only": true
  }'
```

#### INSERT Query
```bash
curl -X POST "https://api.ainative.studio/v1/public/projects/{project_id}/database/query" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "INSERT INTO users (email, name, created_at) VALUES ('\''user@example.com'\'', '\''John Doe'\'', NOW())",
    "timeout_seconds": 30
  }'
```

#### UPDATE Query
```bash
curl -X POST "https://api.ainative.studio/v1/public/projects/{project_id}/database/query" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "UPDATE users SET last_login = NOW() WHERE email = '\''user@example.com'\''",
    "timeout_seconds": 30
  }'
```

#### DELETE Query
```bash
curl -X POST "https://api.ainative.studio/v1/public/projects/{project_id}/database/query" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DELETE FROM sessions WHERE expires_at < NOW() AND logged_out = true",
    "timeout_seconds": 30
  }'
```

#### Complex Analytics Query
```bash
curl -X POST "https://api.ainative.studio/v1/public/projects/{project_id}/database/query" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT DATE(created_at) as signup_date, COUNT(*) as total_signups, COUNT(DISTINCT email) as unique_users FROM users WHERE created_at > NOW() - INTERVAL '\''30 days'\'' GROUP BY DATE(created_at) ORDER BY signup_date DESC",
    "timeout_seconds": 60,
    "read_only": true,
    "max_rows": 1000
  }'
```

### Troubleshooting

#### Query Timeout
**Error:** `Query exceeded timeout of 30 seconds`

**Solutions:**
- Increase `timeout_seconds` parameter (max 300)
- Optimize query with indexes
- Add LIMIT clause to reduce result set
- Break complex queries into smaller chunks

#### SQL Injection Detection
**Error:** `Potential SQL injection detected`

**Solutions:**
- Remove suspicious patterns from query
- Use proper escaping for string literals
- Consider using prepared statements
- Review query for unintended SQL injection patterns

#### Dangerous Command Blocked
**Error:** `Dangerous command 'DROP DATABASE' not allowed`

**Solutions:**
- Avoid using blacklisted commands
- Use appropriate API endpoints for schema changes
- Contact support for legitimate use cases requiring special permissions

#### Read-Only Mode Violation
**Error:** `Command INSERT not allowed in read-only mode`

**Solutions:**
- Set `read_only: false` for write operations
- Use read-only mode only for SELECT queries
- Check application configuration

#### Rate Limit Exceeded
**Error:** `Rate limit exceeded: 100 queries per minute`

**Solutions:**
- Implement request throttling in your application
- Cache query results when possible
- Consider upgrading to higher tier for increased limits
- Batch multiple operations into single queries

## 🤖 Agent & RLHF Operations API

### RLHF Operations

#### Create RLHF Dataset
```bash
POST /v1/public/{project_id}/database/rlhf
Content-Type: application/json
X-API-Key: your_api_key

{
  "prompt": "Explain quantum computing",
  "response_a": "Response A text...",
  "response_b": "Response B text...",
  "preference": "A",
  "metadata": {
    "model": "gpt-4",
    "evaluation_type": "helpfulness"
  }
}
```

#### Log RLHF Interaction
```bash
POST /v1/public/{project_id}/database/rlhf/interactions
Content-Type: application/json
X-API-Key: your_api_key

{
  "type": "user_feedback",
  "prompt": "Generate a React component",
  "response": "Here is your component...",
  "rating": 5
}
```

#### List RLHF Interactions
```bash
GET /v1/public/{project_id}/database/rlhf/interactions?skip=0&limit=100
X-API-Key: your_api_key
```

#### Get RLHF Interaction
```bash
GET /v1/public/{project_id}/database/rlhf/interactions/{interaction_id}
X-API-Key: your_api_key
```

#### Update RLHF Feedback
```bash
PUT /v1/public/{project_id}/database/rlhf/interactions/{interaction_id}/feedback
Content-Type: application/json
X-API-Key: your_api_key

{
  "rating": 4,
  "comment": "Good but could be better"
}
```

#### Get RLHF Statistics
```bash
GET /v1/public/{project_id}/database/rlhf/stats
X-API-Key: your_api_key
```

#### Export RLHF Data
```bash
POST /v1/public/{project_id}/database/rlhf/export
Content-Type: application/json
X-API-Key: your_api_key

{
  "format": "json",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```

### Agent Log Operations

#### Store Agent Log
```bash
POST /v1/public/{project_id}/database/agent-logs
Content-Type: application/json
X-API-Key: your_api_key

{
  "agent_id": "agent_123",
  "action": "search_documents",
  "result": {
    "status": "success",
    "documents_found": 5
  },
  "execution_time_ms": 1500
}
```

#### List Agent Logs
```bash
GET /v1/public/{project_id}/database/agent-logs?skip=0&limit=100
X-API-Key: your_api_key
```

#### Get Agent Log
```bash
GET /v1/public/{project_id}/database/agent-logs/{log_id}
X-API-Key: your_api_key
```

#### Delete Agent Log
```bash
DELETE /v1/public/{project_id}/database/agent-logs/{log_id}
X-API-Key: your_api_key
```

#### Get Agent Logs Statistics
```bash
GET /v1/public/{project_id}/database/agent-logs/stats
X-API-Key: your_api_key
```

#### List Active Agents
```bash
GET /v1/public/{project_id}/database/agents/active
X-API-Key: your_api_key
```

#### List Agent Traces
```bash
GET /v1/public/{project_id}/database/agents/traces
X-API-Key: your_api_key
```

#### Export Agent Logs
```bash
POST /v1/public/{project_id}/database/agent-logs/export
Content-Type: application/json
X-API-Key: your_api_key

{
  "format": "json",
  "agent_id": "optional-agent-id",
  "session_id": "optional-session-id"
}
```

## ⚡ Advanced ZeroDB Services

### 🔬 Quantum Vector Enhancement
ZeroDB includes quantum-inspired vector compression and hybrid scoring:

```bash
POST /v1/public/{project_id}/database/vectors/quantum-compress
Content-Type: application/json
X-API-Key: your_api_key

{
  "vector": [0.1, 0.2, 0.3, ...],
  "compression_ratio": 0.6,
  "preserve_semantics": true
}
```

### 🔍 Semantic Search Service
Advanced semantic search with multiple embedding providers:

```bash
POST /v1/public/{project_id}/database/semantic-search
Content-Type: application/json
X-API-Key: your_api_key

{
  "query": "machine learning algorithms",
  "search_type": "hybrid",  // semantic, keyword, hybrid
  "boost_factors": {
    "recency": 1.2,
    "popularity": 1.1
  },
  "filters": {
    "category": "AI",
    "date_range": "last_30_days"
  }
}
```

### 📦 File Storage (MinIO Integration)
S3-compatible object storage for large files:

```bash
POST /v1/public/{project_id}/database/storage/upload
Content-Type: multipart/form-data
X-API-Key: your_api_key

# File upload with metadata
{
  "file": "<binary_data>",
  "bucket": "documents",
  "key": "research/paper_2024.pdf",
  "metadata": {
    "category": "research",
    "tags": ["AI", "ML"]
  }
}
```

### 🔄 Event Streaming (RedPanda Integration)
Real-time event streaming capabilities:

```bash
POST /v1/public/{project_id}/database/streams/publish
Content-Type: application/json
X-API-Key: your_api_key

{
  "topic": "user_events",
  "event": {
    "type": "document_view",
    "user_id": "user_123",
    "document_id": "doc_456",
    "timestamp": "2024-01-01T12:00:00Z"
  },
  "partition_key": "user_123"
}
```

### 📊 Advanced Analytics
Multi-metric similarity analysis:

```bash
POST /v1/public/{project_id}/database/analytics/similarity
Content-Type: application/json
X-API-Key: your_api_key

{
  "vector_a": [0.1, 0.2, 0.3],
  "vector_b": [0.4, 0.5, 0.6],
  "metrics": ["cosine", "euclidean", "pearson", "jaccard"]
}
```

Response:
```json
{
  "results": [
    {
      "metric": "cosine",
      "similarity_score": 0.95,
      "distance_score": 0.05,
      "computation_time_ms": 1.2
    },
    {
      "metric": "euclidean", 
      "similarity_score": 0.87,
      "distance_score": 0.52,
      "computation_time_ms": 0.8
    }
  ]
}
```

## 💡 Usage Tiers & Limits

### Free Tier
- **Projects:** 3 max
- **Vectors:** 10,000 max
- **Tables:** 5 max
- **Events:** 100,000 per month
- **Storage:** 1 GB

### Pro Tier
- **Projects:** 10 max
- **Vectors:** 100,000 max
- **Tables:** 50 max
- **Events:** 1,000,000 per month
- **Storage:** 10 GB

### Scale Tier
- **Projects:** 50 max
- **Vectors:** 1,000,000 max
- **Tables:** 500 max
- **Events:** 10,000,000 per month
- **Storage:** 100 GB
- **Quantum Features:** Enabled

### Enterprise Tier
- **All Features:** Unlimited
- **Custom Solutions:** Available
- **Priority Support:** Included

## 🛠️ SDKs & Code Examples

### Python SDK
```python
from ainative import AINativeClient

client = AINativeClient(api_key="your_api_key")

# Create project
project = client.zerodb.projects.create({
    "name": "My AI App",
    "tier": "pro"
})

# Upsert vector with advanced options
vector_result = client.zerodb.vectors.upsert(
    project_id=project["id"],
    data={
        "id": "doc_1",
        "vector": [0.1, 0.2, 0.3],
        "metadata": {"type": "document"},
        "quantum_enhanced": True
    }
)

# Advanced vector search with multiple metrics
search_results = client.zerodb.vectors.search(
    project_id=project["id"],
    query_vector=[0.1, 0.2, 0.3],
    top_k=5,
    similarity_metric="cosine",
    hybrid_search=True
)

# Semantic search
semantic_results = client.zerodb.semantic.search(
    project_id=project["id"],
    query="machine learning",
    search_type="hybrid"
)

# Memory operations
memory_result = client.zerodb.memory.store(
    project_id=project["id"],
    content="User prefers technical docs",
    metadata={"user_id": "123", "importance": "high"}
)
```

### TypeScript/JavaScript SDK
```typescript
import { AINativeClient } from '@ainative/sdk';

const client = new AINativeClient({ apiKey: 'your_api_key' });

// Create project
const project = await client.zerodb.projects.create({
  name: 'My AI App',
  tier: 'pro'
});

// Upsert vector with advanced options
const vectorResult = await client.zerodb.vectors.upsert(project.id, {
  id: 'doc_1',
  vector: [0.1, 0.2, 0.3],
  metadata: { type: 'document' },
  quantumEnhanced: true
});

// Advanced vector search
const searchResults = await client.zerodb.vectors.search(project.id, {
  queryVector: [0.1, 0.2, 0.3],
  topK: 5,
  similarityMetric: 'cosine',
  hybridSearch: true
});

// Semantic search
const semanticResults = await client.zerodb.semantic.search(project.id, {
  query: 'machine learning',
  searchType: 'hybrid',
  boostFactors: { recency: 1.2, popularity: 1.1 }
});

// File storage operations
const uploadResult = await client.zerodb.storage.upload(project.id, {
  file: fileBuffer,
  bucket: 'documents',
  key: 'reports/analysis.pdf',
  metadata: { category: 'research' }
});
```

## ⚠️ Error Handling

### Common HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request (invalid input)
- **401** - Unauthorized (authentication failed)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

### Error Response Format
```json
{
  "detail": "Error description",
  "error_code": "RESOURCE_NOT_FOUND",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🏗️ Advanced Architecture Patterns

### Hybrid Search Implementation
```python
# Combine semantic and keyword search for better results
async def advanced_search(client, project_id, query):
    # Semantic search for meaning
    semantic_results = await client.zerodb.semantic.search(
        project_id=project_id,
        query=query,
        search_type="semantic",
        top_k=20
    )
    
    # Vector search for similarity
    vector_results = await client.zerodb.vectors.search(
        project_id=project_id,
        query_vector=semantic_results.query_embedding,
        hybrid_search=True,
        top_k=20
    )
    
    # Combine and re-rank results
    combined_results = merge_results(semantic_results, vector_results)
    return combined_results
```

## 🗄️ Dedicated PostgreSQL Instances

ZeroDB now offers **dedicated PostgreSQL instances** for enterprise applications requiring full database control, custom configurations, and isolated compute resources.

### Provision Dedicated PostgreSQL Instance

```bash
POST /v1/public/{project_id}/postgres/provision
Content-Type: application/json
X-API-Key: your_api_key

{
  "instance_size": "standard-2",
  "database_name": "production_db",
  "version": "15",
  "storage_gb": 100,
  "max_connections": 200,
  "backup_enabled": true,
  "backup_retention_days": 30
}
```

**Available Instance Sizes:**
- `micro-1` - 1 vCPU, 1GB RAM, 10GB storage
- `standard-2` - 2 vCPU, 4GB RAM, 50GB storage  
- `standard-4` - 4 vCPU, 8GB RAM, 100GB storage
- `performance-8` - 8 vCPU, 16GB RAM, 200GB storage
- `performance-16` - 16 vCPU, 32GB RAM, 500GB storage

### Get PostgreSQL Instance Status

```bash
GET /v1/public/{project_id}/postgres/{instance_id}/status
X-API-Key: your_api_key
```

Response:
```json
{
  "instance_id": "postgres-550e8400-e29b",
  "status": "RUNNING",
  "size": "standard-4",
  "database_name": "production_db",
  "version": "15",
  "host": "postgres-550e8400.railway.app",
  "port": 5432,
  "storage_usage_gb": 45,
  "connection_count": 12,
  "uptime_hours": 168,
  "monthly_cost_usd": 75.00,
  "created_at": "2024-01-01T10:00:00Z"
}
```

### Get Database Connection Details

```bash
GET /v1/public/{project_id}/postgres/{instance_id}/connection
X-API-Key: your_api_key
```

Response:
```json
{
  "host": "postgres-550e8400.railway.app",
  "port": 5432,
  "database": "production_db",
  "username": "postgres_user_550e8400",
  "connection_string": "postgresql://postgres_user_550e8400:[REDACTED]@postgres-550e8400.railway.app:5432/production_db",
  "ssl_required": true,
  "max_connections": 200,
  "extensions": ["pgvector", "pg_stat_statements", "uuid-ossp"]
}
```

**Note:** Full connection strings with credentials are returned only to authenticated users.

### PostgreSQL Usage Analytics

```bash
GET /v1/public/{project_id}/postgres/{instance_id}/usage?period=7d
X-API-Key: your_api_key
```

Response:
```json
{
  "period_days": 7,
  "total_queries": 125000,
  "total_credits_consumed": 1250.50,
  "avg_query_time_ms": 45.2,
  "query_breakdown": {
    "SELECT": 95000,
    "INSERT": 15000,
    "UPDATE": 10000,
    "DELETE": 3000,
    "DDL": 2000
  },
  "performance_metrics": {
    "avg_cpu_percent": 35.5,
    "avg_memory_percent": 62.1,
    "storage_usage_gb": 45.2,
    "active_connections": 12
  },
  "billing_summary": {
    "instance_charges_usd": 17.50,
    "usage_credits_usd": 1.25,
    "total_usd": 18.75
  }
}
```

### Instance Management Operations

#### Scale Instance
```bash
PUT /v1/public/{project_id}/postgres/{instance_id}/scale
Content-Type: application/json
X-API-Key: your_api_key

{
  "new_size": "performance-8",
  "scale_immediately": false
}
```

#### Update Configuration
```bash
PUT /v1/public/{project_id}/postgres/{instance_id}/config
Content-Type: application/json
X-API-Key: your_api_key

{
  "max_connections": 300,
  "shared_buffers": "256MB",
  "effective_cache_size": "1GB",
  "maintenance_work_mem": "64MB"
}
```

#### Create Database Backup
```bash
POST /v1/public/{project_id}/postgres/{instance_id}/backup
Content-Type: application/json
X-API-Key: your_api_key

{
  "backup_name": "pre_migration_backup",
  "include_data": true,
  "compression": true
}
```

#### Delete Instance
```bash
DELETE /v1/public/{project_id}/postgres/{instance_id}
X-API-Key: your_api_key
Content-Type: application/json

{
  "confirm_deletion": true,
  "create_final_backup": true
}
```

### Direct SQL Access

With dedicated PostgreSQL instances, you can connect directly using any PostgreSQL client:

```python
# Python with psycopg2
import psycopg2

connection = psycopg2.connect(
    host="postgres-550e8400.railway.app",
    port=5432,
    database="production_db",
    user="postgres_user_550e8400",
    password="your_password",
    sslmode="require"
)

# Execute custom SQL
cursor = connection.cursor()
cursor.execute("""
    CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        embedding VECTOR(1536),
        metadata JSONB
    );
""")
connection.commit()
```

```javascript
// Node.js with pg
const { Client } = require('pg');

const client = new Client({
  host: 'postgres-550e8400.railway.app',
  port: 5432,
  database: 'production_db',
  user: 'postgres_user_550e8400',
  password: 'your_password',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Execute custom queries
const result = await client.query(`
  SELECT id, name, embedding <-> $1 AS similarity
  FROM products
  WHERE metadata @> $2
  ORDER BY similarity
  LIMIT 10
`, [[0.1, 0.2, 0.3], {"category": "electronics"}]);
```

### Dedicated PostgreSQL SDK Integration

```python
# Python SDK with dedicated PostgreSQL
from ainative import AINativeClient

client = AINativeClient(api_key="your_api_key")

# Provision dedicated instance
postgres_instance = await client.zerodb.postgres.provision({
    "project_id": project_id,
    "instance_size": "standard-4",
    "database_name": "my_app_db",
    "storage_gb": 100
})

# Get connection details
connection_info = await client.zerodb.postgres.connection_details(
    project_id=project_id,
    instance_id=postgres_instance["instance_id"]
)

# Monitor usage
usage_stats = await client.zerodb.postgres.usage(
    project_id=project_id,
    instance_id=postgres_instance["instance_id"],
    period="30d"
)

print(f"Monthly cost: ${usage_stats['billing_summary']['total_usd']}")
print(f"Total queries: {usage_stats['total_queries']}")
```

### Billing & Credits for Dedicated PostgreSQL

Dedicated PostgreSQL instances use a hybrid billing model:

#### Instance Charges (Fixed Monthly)
- **micro-1**: $15/month
- **standard-2**: $45/month
- **standard-4**: $75/month  
- **performance-8**: $150/month
- **performance-16**: $300/month

#### Usage-Based Credits
- **Simple Query** (SELECT with basic WHERE): 0.001 credits
- **Complex Query** (JOINs, aggregations): 0.01 credits
- **Vector Operations** (similarity search): 0.02 credits
- **DDL Operations** (CREATE, ALTER, DROP): 0.05 credits

Credit pricing: **$0.001 per credit**

#### Example Monthly Bill
```json
{
  "instance_charges": {
    "instance_size": "standard-4",
    "monthly_base_cost": 75.00,
    "uptime_percentage": 100,
    "total_instance_cost": 75.00
  },
  "usage_charges": {
    "total_queries": 500000,
    "total_credits": 2500.00,
    "credit_cost_per_unit": 0.001,
    "total_usage_cost": 2.50
  },
  "total_monthly_cost": 77.50
}
```

### PostgreSQL vs ZeroDB Serverless Comparison

| Feature | ZeroDB Serverless | Dedicated PostgreSQL |
|---------|-------------------|----------------------|
| **Setup** | Instant | 2-3 minutes provisioning |
| **Scaling** | Automatic | Manual scaling required |
| **Cost Model** | Pay-per-query only | Fixed instance + usage |
| **SQL Access** | API-only | Direct SQL + API |
| **Customization** | Limited | Full PostgreSQL control |
| **Best For** | Rapid prototyping, serverless apps | Production apps, complex queries |
| **Min Monthly Cost** | $0 | $15 (micro-1 instance) |
| **Data Isolation** | Project-scoped | Dedicated instance |
| **Extensions** | Pre-installed pgvector | Full extension library |

### When to Choose Dedicated PostgreSQL

✅ **Choose Dedicated PostgreSQL When:**
- You need direct SQL access and custom queries
- Your application requires specific PostgreSQL extensions
- You need predictable performance and dedicated resources  
- You want full control over database configuration
- You're migrating from an existing PostgreSQL setup
- You need consistent sub-10ms query performance

✅ **Choose ZeroDB Serverless When:**
- You're building a prototype or MVP
- You want automatic scaling with zero maintenance
- Your usage is unpredictable or bursty
- You only need basic CRUD and vector operations
- You want to minimize infrastructure management

### Migration Between Models

#### Serverless to Dedicated
```bash
# Export data from serverless ZeroDB
POST /v1/public/{project_id}/database/export
{
  "format": "postgresql_dump",
  "include_vectors": true,
  "include_metadata": true
}

# Provision dedicated instance
POST /v1/public/{project_id}/postgres/provision
{
  "instance_size": "standard-4",
  "import_from_export": "export_id_from_above"
}
```

#### Dedicated to Serverless
```bash
# Create backup of dedicated instance
POST /v1/public/{project_id}/postgres/{instance_id}/backup

# Import to serverless ZeroDB
POST /v1/public/{project_id}/database/import
{
  "source": "postgresql_backup",
  "backup_id": "backup_id_from_above"
}
```

### PostgreSQL Infrastructure & Data Isolation

ZeroDB provides **project-scoped data isolation** within a robust PostgreSQL infrastructure:

#### Data Isolation Model
```sql
-- All data is project-scoped with foreign key constraints
CREATE TABLE zerodb_vectors (
    vector_id TEXT PRIMARY KEY,
    project_id UUID REFERENCES zerodb_projects(project_id) ON DELETE CASCADE,
    namespace TEXT DEFAULT 'default',
    vector_embedding FLOAT[],
    metadata JSONB
);

-- Automatic project isolation in all queries
SELECT * FROM zerodb_vectors WHERE project_id = 'your-project-id';
```

#### Project Database Features
- **Automatic Isolation**: All data automatically scoped to your project
- **pgvector Extension**: Native vector operations and indexing
- **JSONB Support**: Flexible metadata storage and querying
- **Foreign Key Constraints**: Automatic cleanup when projects are deleted
- **Connection Pooling**: Optimized connection management
- **Backup & Recovery**: Automated daily backups

#### Access Patterns
```bash
# All operations are automatically project-scoped
GET /v1/public/{project_id}/database/tables
GET /v1/public/{project_id}/database/vectors/search
POST /v1/public/{project_id}/database/rows
```

### Multi-Backend Vector Storage
ZeroDB automatically chooses the optimal backend based on your data:

- **PostgreSQL + pgvector**: For transactional data with vector components
- **Qdrant**: For high-performance vector similarity search  
- **Quantum-Enhanced**: For compressed storage with preserved semantics

### Event-Driven Architecture
```python
# Set up real-time processing pipeline
async def setup_event_pipeline(client, project_id):
    # Subscribe to document events
    await client.zerodb.events.subscribe(
        project_id=project_id,
        topic="document_events",
        callback=process_document_event
    )
    
    # Process events as they arrive
    async def process_document_event(event):
        if event.type == "document_uploaded":
            # Extract text and create embedding
            text = await extract_text(event.document_url)
            embedding = await generate_embedding(text)
            
            # Store in vector database
            await client.zerodb.vectors.upsert(
                project_id=project_id,
                data={
                    "id": event.document_id,
                    "vector": embedding,
                    "metadata": {"source": "uploaded", "text": text}
                }
            )
```

## 🚀 Best Practices

### 1. Authentication & Security
- Use API keys for production applications
- Keep API keys secure and never commit them to version control
- Rotate API keys regularly
- Use project-scoped permissions

### 2. Vector Operations
- Use appropriate vector dimensions (1536 for OpenAI, 768 for sentence transformers)
- Implement batch operations for better performance (up to 1000 vectors per batch)
- Use namespaces to organize vectors by context or domain
- Enable quantum enhancement for large-scale deployments
- Choose appropriate similarity metrics based on your data type

### 3. Memory Management
- Include relevant metadata for better searchability
- Use descriptive tags to categorize memories
- Implement proper cleanup for old memories
- Use importance scoring for memory prioritization
- Leverage agent-specific memory namespaces

### 4. Performance Optimization
- Implement pagination for large result sets (limit: 1000 items per page)
- Use appropriate filters to reduce data transfer
- Cache frequently accessed vectors and embeddings
- Use hybrid search for better relevance
- Implement connection pooling for high-throughput applications

### 5. Error Handling & Monitoring
- Always check HTTP status codes
- Implement exponential backoff for transient failures
- Log errors with context for debugging
- Monitor API usage and rate limits
- Set up alerts for service degradation

### 6. Data Organization
- Use consistent naming conventions for projects and tables
- Implement proper data lifecycle management
- Use metadata effectively for filtering and organization
- Regular cleanup of unused data to optimize performance

## 📈 Monitoring & Analytics

### Project Usage Statistics
```bash
GET /v1/public/{project_id}/usage
X-API-Key: your_api_key
```

Response:
```json
{
  "vectors_count": 5000,
  "tables_count": 12,
  "events_count": 25000,
  "memory_usage_mb": 150,
  "storage_usage_mb": 500,
  "tier_limits": {
    "max_vectors": 100000,
    "max_tables": 50,
    "max_events_per_month": 1000000
  }
}
```

## 🔗 ZeroDB Unified Architecture

### Why Not Separate Services?

Unlike traditional approaches with separate ZeroGres, ZeroSQL, and ZeroML services, ZeroDB provides a **unified intelligent database platform** that:

1. **Reduces Complexity**: Single API for all database operations
2. **Improves Performance**: Optimized data flow between components  
3. **Enables Advanced Features**: Cross-component optimization and intelligence
4. **Simplifies Management**: One service to monitor and maintain

### Architecture Benefits

```mermaid
graph TD
    A[Your Application] --> B[ZeroDB API]
    B --> C[PostgreSQL + pgvector]
    B --> D[Qdrant Vector DB]
    B --> E[MinIO File Storage]
    B --> F[RedPanda Streaming]
    B --> G[Quantum Enhancement]
    B --> H[Semantic Search]
    
    C --> I[Unified Query Engine]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
```

### PostgreSQL Data Models

ZeroDB offers two PostgreSQL deployment models:

#### 1. Serverless PostgreSQL (Default)
Project-scoped isolation within shared infrastructure:

```javascript
// Serverless project with automatic isolation
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "database_enabled": true,
  "database_type": "serverless",
  "database_config": {
    "vector_dimensions": 1536,
    "pgvector_enabled": true,
    "isolation_level": "project_scoped"
  }
}
```

#### 2. Dedicated PostgreSQL Instances
True dedicated instances with full control:

```javascript
// Dedicated PostgreSQL instance
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "database_enabled": true,
  "database_type": "dedicated_postgresql",
  "postgres_instance": {
    "instance_id": "postgres-550e8400-e29b",
    "host": "postgres-550e8400.railway.app",
    "size": "standard-4",
    "status": "RUNNING",
    "monthly_cost_usd": 75.00
  }
}
```

### Service Integration Matrix

| Feature | PostgreSQL | Vector DB | File Storage | Streaming | Quantum | Semantic |
|---------|------------|-----------|--------------|-----------|---------|----------|
| **CRUD Operations** | ✅ Project-Scoped | ✅ Vectors | ✅ Files | ✅ Events | ➖ | ➖ |
| **Search & Query** | ✅ SQL + pgvector | ✅ Similarity | ✅ Metadata | ✅ Real-time | ✅ Enhanced | ✅ Advanced |
| **Analytics** | ✅ Aggregation | ✅ Clustering | ✅ Usage | ✅ Stream Processing | ✅ Compression | ✅ Intent Analysis |
| **AI Integration** | ✅ Embeddings | ✅ Native | ✅ Content Analysis | ✅ Event Processing | ✅ QNN | ✅ NLP |
| **Data Isolation** | ✅ Project-Level | ✅ Namespaced | ✅ Bucket-Based | ✅ Topic-Based | ✅ Per-Project | ✅ Context-Aware |

## 🛠️ Developer Tools & SDKs

ZeroDB provides official SDKs, MCP integrations, and developer tools to accelerate your development workflow.

### MCP Server (Model Context Protocol)

The **AINative ZeroDB MCP Server** enables AI assistants like Windsurf and other MCP-compatible tools to directly interact with your ZeroDB projects.

**NPM Package:** `ainative-zerodb-mcp-server`
**Version:** 2.0.8
**GitHub:** https://github.com/AINative-Studio/ainative-zerodb-mcp-server
**Operations:** 60+ ZeroDB operations including vectors, quantum, NoSQL, files, events, RLHF, and memory

#### Installation

```bash
# Install globally
npm install -g ainative-zerodb-mcp-server

# Or add to your project
npm install ainative-zerodb-mcp-server
```

#### Configuration

Add to your MCP settings file (e.g., AI editor config):

```json
{
  "mcpServers": {
    "zerodb": {
      "command": "npx",
      "args": ["-y", "ainative-zerodb-mcp-server"],
      "env": {
        "ZERODB_API_KEY": "your_api_key_here",
        "ZERODB_PROJECT_ID": "your_project_id_here"
      }
    }
  }
}
```

#### Features

- **Vector Operations**: Upsert, search, batch operations
- **Quantum Enhancement**: Quantum-inspired compression and hybrid scoring
- **NoSQL Tables**: MongoDB-style document storage
- **File Storage**: S3-compatible object storage
- **Event Streaming**: Real-time event publishing
- **Agent Memory**: Persistent context for AI agents
- **RLHF Data Collection**: Feedback collection for model improvement
- **Dedicated PostgreSQL**: Full SQL access to dedicated instances

#### Usage with MCP-Compatible AI Editors

Once configured, your AI assistant can directly interact with your ZeroDB:

```
User: "Store this document in ZeroDB with embeddings"
AI Assistant: *Uses zerodb_embed_and_store tool to generate embeddings and store the document*

User: "Search my knowledge base for information about machine learning"
AI Assistant: *Uses zerodb_search_memory or zerodb_vector_search to find relevant documents*

User: "Create a new table for customer data"
AI Assistant: *Uses zerodb_create_table to create a NoSQL table with the specified schema*
```

### TypeScript/JavaScript Client SDK

The **@zerodb/mcp-client** provides a production-ready TypeScript/JavaScript client for ZeroDB MCP Bridge.

**NPM Package:** `@zerodb/mcp-client`
**Version:** 1.0.0
**GitHub:** https://github.com/ainative-studio/zerodb-mcp-client
**Language:** TypeScript (with full type definitions)

#### Installation

```bash
npm install @zerodb/mcp-client
```

#### Quick Start

```typescript
import { ZeroDBClient } from '@zerodb/mcp-client';

// Initialize client
const client = new ZeroDBClient({
  apiKey: 'your_api_key',
  projectId: 'your_project_id'
});

// Store agent memory
await client.memory.store({
  content: 'User prefers technical documentation',
  role: 'assistant',
  metadata: { importance: 'high' }
});

// Search memories
const memories = await client.memory.search({
  query: 'user preferences',
  limit: 10
});

// Upsert vectors
await client.vectors.upsert({
  vector_embedding: embeddings,
  document: 'Sample document text',
  metadata: { category: 'docs' }
});

// Semantic search
const results = await client.vectors.search({
  query_vector: queryEmbedding,
  limit: 5,
  threshold: 0.7
});
```

### Python SDK (Coming Soon)

Official Python SDK for ZeroDB is in development. Current workaround using `requests`:

```python
import requests

class ZeroDBClient:
    def __init__(self, api_key: str, project_id: str):
        self.api_key = api_key
        self.project_id = project_id
        self.base_url = "https://api.ainative.studio/v1/public"
        self.headers = {"X-API-Key": api_key, "Content-Type": "application/json"}

    def store_memory(self, content: str, role: str = "assistant"):
        url = f"{self.base_url}/{self.project_id}/database/memory"
        response = requests.post(url, headers=self.headers, json={
            "content": content,
            "role": role
        })
        return response.json()

    def search_vectors(self, query_vector: list, top_k: int = 10):
        url = f"{self.base_url}/{self.project_id}/database/vectors/search"
        response = requests.post(url, headers=self.headers, json={
            "query_vector": query_vector,
            "top_k": top_k
        })
        return response.json()
```

### CLI Tool (In Development)

A command-line interface for ZeroDB is under development:

```bash
# Planned commands
zerodb init                          # Initialize project
zerodb projects list                 # List all projects
zerodb vectors upsert --file data.json
zerodb memory search "query text"
zerodb postgres provision --size standard-4
```

### Integration Examples

#### Windsurf IDE Integration

Add ZeroDB MCP server to Windsurf settings:

```json
{
  "mcp": {
    "servers": {
      "zerodb": {
        "command": "npx",
        "args": ["-y", "ainative-zerodb-mcp-server"],
        "env": {
          "ZERODB_API_KEY": "${env:ZERODB_API_KEY}",
          "ZERODB_PROJECT_ID": "${env:ZERODB_PROJECT_ID}"
        }
      }
    }
  }
}
```

#### VSCode Extension (Coming Soon)

Official VSCode extension for ZeroDB will provide:
- Direct database browsing
- Vector search interface
- SQL query execution
- Memory management
- Real-time usage statistics

### Community Tools

- **ZeroDB Playground**: Interactive API testing (https://api.ainative.studio/docs)
- **Postman Collection**: Pre-configured API collection for Postman
- **Insomnia Workspace**: Import-ready workspace for Insomnia
- **OpenAPI Spec**: Full OpenAPI 3.0 specification available

### Getting Help

- **Documentation**: https://docs.ainative.studio
- **GitHub Issues**: Report bugs or request features
- **Discord Community**: Join for real-time support
- **Email Support**: support@ainative.studio
- **Status Page**: https://status.ainative.studio

## 🔗 Additional Resources

- **API Documentation:** Available at `https://api.ainative.studio/docs`
- **Interactive Playground:** Test endpoints in real-time
- **Support:** Contact our support team for assistance
- **Community:** Join our developer community for discussions and updates
- **Status Page:** Monitor service availability and performance
- **SDKs:** Available for Python, TypeScript, Go, and more

## 📊 Performance & Limits

### API Rate Limits
- **Free Tier**: 1,000 requests/hour
- **Pro Tier**: 10,000 requests/hour  
- **Scale Tier**: 100,000 requests/hour
- **Enterprise**: Custom limits

### Response Times (95th percentile)
- **Vector Search**: < 50ms
- **Semantic Search**: < 200ms
- **CRUD Operations**: < 100ms
- **File Upload**: < 2s (100MB files)
- **Quantum Enhancement**: < 300ms

## 📝 Changelog

### v1.5.0 (Latest) - Embeddings API & Developer Tools
- ✅ **Embeddings API**: Custom 1536-dimension embeddings (3 new endpoints)
  - Generate embeddings from text
  - Embed and store documents with metadata
  - Semantic search with natural language queries
- ✅ **MCP Server Integration**: Official NPM package (v2.0.8) with 60+ operations
- ✅ **TypeScript Client SDK**: @zerodb/mcp-client (v1.0.0) for production apps
- ✅ **SQL Query Execution API**: Direct SQL execution with security validation
- ✅ **Path Standardization**: All endpoints use /v1/public/* for consistency
- ✅ **Enhanced Documentation**: Complete API reference with all 42+ endpoints
- ✅ **Developer Tools Guide**: MCP server, SDKs, and integration examples

### v1.4.0 - Complete Data Platform
- ✅ **Dedicated PostgreSQL Instances**: True dedicated PostgreSQL with full control
- ✅ **Direct SQL Access**: Connect with any PostgreSQL client
- ✅ **Hybrid Billing Model**: Instance costs + usage-based credits
- ✅ **PostgreSQL Query Tracking**: Real-time query monitoring and billing
- ✅ **Instance Management**: Scale, backup, configure dedicated instances
- ✅ **Migration Tools**: Easy transition between serverless and dedicated
- ✅ **Kong SQL Proxy**: Advanced query routing and analytics
- ✅ **Enterprise Features**: Custom configurations and dedicated support

### v1.3.0 - Enhanced Platform
- ✅ **Unified Architecture**: Single API for all database operations
- ✅ **Quantum Vector Enhancement**: AI-powered compression and scoring
- ✅ **Advanced Similarity Metrics**: 14 different similarity algorithms
- ✅ **Semantic Search Service**: Multi-provider semantic search
- ✅ **File Storage Integration**: S3-compatible object storage
- ✅ **Event Streaming**: Real-time data processing with RedPanda
- ✅ **Hybrid Search**: Combine semantic, vector, and keyword search
- ✅ **Performance Optimizations**: 3x faster vector operations

### v1.2.0 - Core Platform
- ✅ Complete CRUD operations for table rows
- ✅ Enhanced vector search with filtering
- ✅ Improved memory management capabilities
- ✅ Agent logging and RLHF dataset collection
- ✅ File metadata management
- ✅ Real-time event streaming

---

**ZeroDB Platform Developer Guide**
*Last Updated: 2025-11-28*
*Version: 1.5.0*

This guide provides a comprehensive overview of the unified ZeroDB platform with complete documentation for all 42+ production endpoints, including the new Embeddings API, SQL Query Execution, and developer tools. For the most up-to-date information and interactive API documentation, visit the official API docs at `https://api.ainative.studio/docs`.