# ZeroDB MCP Server Guide

**Version**: 2.0
**Last Updated**: November 28, 2025
**Status**: Production Ready - All Endpoints Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [API Reference](#api-reference)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## Overview

### What is the ZeroDB MCP Server?

The ZeroDB MCP (Model Context Protocol) Server is a comprehensive API bridge that exposes all ZeroDB capabilities to AI agents, agent frameworks, and external integrations. It provides a standardized, high-performance interface for:

- Vector database operations with semantic search
- Quantum-enhanced vector compression and similarity
- NoSQL table operations with flexible schemas
- File storage and management
- Event-driven architecture support
- Project and resource management
- RLHF (Reinforcement Learning from Human Feedback) data collection
- Agent memory and context management
- Administrative operations

### Key Features

- **60+ Operations**: Comprehensive coverage of all ZeroDB functionality
- **Dual Authentication**: API key and JWT token support
- **Tiered Rate Limiting**: Fair usage policies with free, pro, and enterprise tiers
- **Quantum Enhancement**: Leverage quantum-inspired algorithms for better performance
- **Real-time Events**: WebSocket support for live updates
- **Batch Operations**: Efficient bulk processing capabilities
- **Standardized Errors**: Consistent error handling with detailed messages
- **Performance Optimized**: Sub-100ms average response times

### All 80+ Operations by Category

| Category | Operations | Count |
|----------|------------|-------|
| **Vector Operations** | upsert_vector, batch_upsert_vectors, search_vectors, delete_vector, get_vector, list_vectors, vector_stats, create_vector_index, optimize_vector_storage, export_vectors | 10 |
| **Quantum Operations** | quantum_compress_vector, quantum_decompress_vector, quantum_hybrid_similarity, quantum_optimize_space, quantum_feature_map, quantum_kernel_similarity | 6 |
| **Table Operations** | create_table, list_tables, get_table, delete_table, insert_rows, query_rows, update_rows, delete_rows | 8 |
| **File Operations** ✅ | upload_file, download_file, list_files, delete_file, get_file_metadata, generate_presigned_url, get_file_stats | 7 |
| **Event Operations** | create_event, list_events, get_event, subscribe_to_events, event_stats | 5 |
| **Project Operations** | create_project, get_project, list_projects, update_project, delete_project, get_project_stats, enable_database | 7 |
| **RLHF Operations** ✅ | log_interaction, list_interactions, get_interaction, update_feedback, get_stats, export_data, create_dataset | 7 |
| **Agent Log Operations** ✅ | create_log, list_logs, get_log, delete_log, get_stats, list_active, list_traces, export_logs | 8 |
| **Memory Operations** | store_memory, search_memory, get_context | 3 |
| **Admin Operations** | admin_get_system_stats, admin_list_all_projects, admin_get_user_usage, admin_system_health, admin_optimize_database | 5 |

**Recent Updates (November 28, 2025):**
- ✅ **+6 File Operations**: All file CRUD operations now available via public API
- ✅ **+6 RLHF Operations**: RLHF operations moved from admin-only to public database path
- ✅ **+7 Agent Log Operations**: Full agent log management now publicly accessible
- ✅ **Total**: 20 new endpoints added to public API

---

## Getting Started

### Installation and Setup

#### Prerequisites

- Python 3.9+ or Node.js 16+
- ZeroDB account with API credentials
- Network access to ZeroDB API endpoint

#### Python SDK Installation

```bash
pip install ainative-zerodb
```

#### Node.js SDK Installation

```bash
npm install @ainative/zerodb-sdk
```

#### Environment Configuration

Create a `.env` file with your credentials:

```bash
# ZeroDB API Configuration
ZERODB_API_ENDPOINT=https://api.zerodb.ai/v1
ZERODB_API_KEY=your_api_key_here

# Optional: JWT Token (alternative to API key)
ZERODB_JWT_TOKEN=your_jwt_token_here

# Project Configuration
ZERODB_PROJECT_ID=your_project_id_here
```

#### Quick Start Example (Python)

```python
from ainative.zerodb import ZeroDBClient

# Initialize client with API key
client = ZeroDBClient(
    api_key="your_api_key_here",
    endpoint="https://api.zerodb.ai/v1"
)

# Create a project
project = await client.execute("create_project", {
    "name": "My First Project",
    "description": "Testing ZeroDB MCP Server",
    "tier": "free"
})

print(f"Project created: {project['result']['project_id']}")
```

#### Quick Start Example (Node.js)

```javascript
const { ZeroDBClient } = require('@ainative/zerodb-sdk');

// Initialize client with API key
const client = new ZeroDBClient({
  apiKey: 'your_api_key_here',
  endpoint: 'https://api.zerodb.ai/v1'
});

// Create a project
const project = await client.execute('create_project', {
  name: 'My First Project',
  description: 'Testing ZeroDB MCP Server',
  tier: 'free'
});

console.log(`Project created: ${project.result.project_id}`);
```

---

## Authentication

The ZeroDB MCP Server supports two authentication methods:

### API Key Authentication

API keys are long-lived credentials that don't expire unless manually revoked. They're ideal for server-to-server integrations and long-running agents.

#### Obtaining an API Key

1. Log in to your ZeroDB dashboard
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Copy and securely store your API key

#### Using API Keys

**HTTP Header:**
```
X-API-Key: your_api_key_here
```

**Python Example:**
```python
import requests

headers = {
    "X-API-Key": "your_api_key_here",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://api.zerodb.ai/v1/mcp/execute",
    headers=headers,
    json={
        "operation": "list_projects",
        "params": {}
    }
)
```

**cURL Example:**
```bash
curl -X POST https://api.zerodb.ai/v1/mcp/execute \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "list_projects",
    "params": {}
  }'
```

### JWT Token Authentication

JWT tokens are short-lived (typically 8 hours) and ideal for user-facing applications where you want time-limited access.

#### Obtaining a JWT Token

```python
import requests

response = requests.post(
    "https://api.zerodb.ai/v1/auth/login",
    json={
        "email": "user@example.com",
        "password": "your_password"
    }
)

jwt_token = response.json()["access_token"]
```

#### Using JWT Tokens

**HTTP Header:**
```
Authorization: Bearer your_jwt_token_here
```

**Python Example:**
```python
import requests

headers = {
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://api.zerodb.ai/v1/mcp/execute",
    headers=headers,
    json={
        "operation": "get_project",
        "params": {"project_id": "proj_123"}
    }
)
```

### Security Best Practices

1. **Never commit credentials**: Use environment variables or secret management services
2. **Rotate API keys regularly**: Update keys every 90 days minimum
3. **Use JWT for user apps**: API keys for server-to-server only
4. **Enable IP whitelisting**: Restrict API access to known IPs in production
5. **Monitor API usage**: Set up alerts for unusual activity

---

## API Reference

### Endpoint

All MCP operations are accessed through a single endpoint:

```
POST https://api.zerodb.ai/v1/mcp/execute
```

### Request Format

```json
{
  "operation": "operation_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "operation": "operation_name",
  "result": {
    "...": "operation-specific data"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "category": "validation",
    "status": 400,
    "message": "Missing required field: project_id",
    "user_message": "Invalid input: Missing required field: project_id",
    "timestamp": "2025-10-14T12:34:56.789Z",
    "details": {
      "field": "project_id"
    }
  }
}
```

---

## Vector Operations (10)

Vector operations provide high-performance semantic search and storage for embeddings.

### 1. upsert_vector

Store or update a vector in ZeroDB.

**Parameters:**
- `project_id` (required): Project UUID
- `namespace` (optional): Vector namespace (default: "default")
- `embedding` (required): Vector embedding (list of floats, typically 1536 dimensions)
- `document` (required): Associated document text
- `metadata` (optional): Dictionary of metadata

**Returns:**
- `vector_id`: Unique vector identifier
- `status`: "success"
- `namespace`: Vector namespace
- `created_at`: Creation timestamp

**Example Request:**
```json
{
  "operation": "upsert_vector",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "namespace": "product_docs",
    "embedding": [0.123, -0.456, 0.789, ...],
    "document": "ZeroDB is a quantum-enhanced vector database",
    "metadata": {
      "category": "documentation",
      "version": "1.0"
    }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "upsert_vector",
  "result": {
    "vector_id": "vec_7d4f3e2a1b9c8e5f",
    "status": "success",
    "namespace": "product_docs",
    "created_at": "2025-10-14T12:34:56.789Z"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 2. batch_upsert_vectors

Batch insert multiple vectors for improved efficiency.

**Parameters:**
- `project_id` (required): Project UUID
- `namespace` (optional): Vector namespace (default: "default")
- `vectors` (required): Array of vector objects, each containing:
  - `embedding` (required): Vector embedding
  - `document` (required): Document text
  - `metadata` (optional): Metadata dictionary

**Returns:**
- `count`: Number of successfully inserted vectors
- `failed`: Number of failed insertions
- `errors`: Array of error details for failed vectors
- `total_time_ms`: Total operation time in milliseconds
- `status`: "success" or "partial"

**Example Request:**
```json
{
  "operation": "batch_upsert_vectors",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "namespace": "support_tickets",
    "vectors": [
      {
        "embedding": [0.1, 0.2, 0.3, ...],
        "document": "How do I reset my password?",
        "metadata": {"category": "authentication"}
      },
      {
        "embedding": [0.4, 0.5, 0.6, ...],
        "document": "Billing question about subscription",
        "metadata": {"category": "billing"}
      }
    ]
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "batch_upsert_vectors",
  "result": {
    "count": 2,
    "failed": 0,
    "errors": [],
    "total_time_ms": 125.43,
    "status": "success"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 3. search_vectors

Perform semantic search across vectors.

**Parameters:**
- `project_id` (required): Project UUID
- `query_vector` (required): Query embedding (list of floats)
- `limit` (optional): Maximum results to return (default: 10)
- `threshold` (optional): Minimum similarity score 0-1 (default: 0.7)
- `namespace` (optional): Filter by namespace

**Returns:**
- `results`: Array of matching vectors with:
  - `vector_id`: Vector identifier
  - `document`: Document text
  - `metadata`: Associated metadata
  - `namespace`: Vector namespace
  - `created_at`: Creation timestamp
- `count`: Number of results returned
- `query_time_ms`: Search duration in milliseconds

**Example Request:**
```json
{
  "operation": "search_vectors",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "query_vector": [0.15, 0.23, 0.31, ...],
    "limit": 5,
    "threshold": 0.75,
    "namespace": "product_docs"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "search_vectors",
  "result": {
    "results": [
      {
        "vector_id": "vec_7d4f3e2a1b9c8e5f",
        "document": "ZeroDB is a quantum-enhanced vector database",
        "metadata": {"category": "documentation"},
        "namespace": "product_docs",
        "created_at": "2025-10-14T12:34:56.789Z"
      }
    ],
    "count": 1,
    "query_time_ms": 23.5
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 4. delete_vector

Delete a specific vector by ID.

**Parameters:**
- `project_id` (required): Project UUID
- `vector_id` (required): Vector identifier to delete

**Returns:**
- `status`: "success" or "not_found"
- `deleted`: Boolean indicating success
- `vector_id`: Deleted vector ID (if successful)

**Example Request:**
```json
{
  "operation": "delete_vector",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "vector_id": "vec_7d4f3e2a1b9c8e5f"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "delete_vector",
  "result": {
    "status": "success",
    "deleted": true,
    "vector_id": "vec_7d4f3e2a1b9c8e5f"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 5. get_vector

Retrieve a specific vector by ID.

**Parameters:**
- `project_id` (required): Project UUID
- `vector_id` (required): Vector identifier

**Returns:**
- `status`: "success" or "not_found"
- `vector`: Vector object (if found) containing:
  - `vector_id`: Vector identifier
  - `embedding`: Vector embedding
  - `document`: Document text
  - `metadata`: Associated metadata
  - `namespace`: Vector namespace
  - `created_at`: Creation timestamp

**Example Request:**
```json
{
  "operation": "get_vector",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "vector_id": "vec_7d4f3e2a1b9c8e5f"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "get_vector",
  "result": {
    "status": "success",
    "vector": {
      "vector_id": "vec_7d4f3e2a1b9c8e5f",
      "embedding": [0.123, -0.456, 0.789, ...],
      "document": "ZeroDB is a quantum-enhanced vector database",
      "metadata": {"category": "documentation"},
      "namespace": "product_docs",
      "created_at": "2025-10-14T12:34:56.789Z"
    }
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 6. list_vectors

List vectors in a project with pagination.

**Parameters:**
- `project_id` (required): Project UUID
- `namespace` (optional): Filter by namespace
- `limit` (optional): Maximum results (default: 100, max: 1000)
- `offset` (optional): Pagination offset (default: 0)

**Returns:**
- `vectors`: Array of vector metadata
- `total_count`: Number of vectors returned
- `has_more`: Boolean indicating if more results exist
- `offset`: Current pagination offset
- `limit`: Current limit

**Example Request:**
```json
{
  "operation": "list_vectors",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "namespace": "product_docs",
    "limit": 50,
    "offset": 0
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "list_vectors",
  "result": {
    "vectors": [
      {
        "vector_id": "vec_7d4f3e2a1b9c8e5f",
        "document": "ZeroDB is a quantum-enhanced vector database",
        "namespace": "product_docs",
        "metadata": {"category": "documentation"},
        "created_at": "2025-10-14T12:34:56.789Z"
      }
    ],
    "total_count": 1,
    "has_more": false,
    "offset": 0,
    "limit": 50
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 7. vector_stats

Get statistics about vectors in a project.

**Parameters:**
- `project_id` (required): Project UUID

**Returns:**
- `total_vectors`: Total number of vectors
- `namespaces`: Array of namespace statistics with:
  - `namespace`: Namespace name
  - `count`: Number of vectors in namespace
- `storage_bytes`: Estimated total storage in bytes
- `avg_vector_size`: Average vector size in bytes
- `storage_mb`: Storage in megabytes

**Example Request:**
```json
{
  "operation": "vector_stats",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "vector_stats",
  "result": {
    "total_vectors": 1523,
    "namespaces": [
      {"namespace": "product_docs", "count": 845},
      {"namespace": "support_tickets", "count": 678}
    ],
    "storage_bytes": 11661312,
    "avg_vector_size": 7656,
    "storage_mb": 11.12
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 8. create_vector_index

Create an optimized index for faster vector search.

**Parameters:**
- `project_id` (required): Project UUID
- `namespace` (required): Namespace to index
- `index_type` (optional): Index algorithm - "HNSW", "IVF", or "FLAT" (default: "HNSW")

**Returns:**
- `index_id`: Created index identifier
- `index_type`: Index algorithm used
- `namespace`: Indexed namespace
- `vector_count`: Number of vectors indexed
- `estimated_build_time`: Estimated build time in seconds
- `status`: "completed" or "building"
- `message`: Status message

**Example Request:**
```json
{
  "operation": "create_vector_index",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "namespace": "product_docs",
    "index_type": "HNSW"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "create_vector_index",
  "result": {
    "index_id": "idx_9f8e7d6c5b4a3210",
    "index_type": "HNSW",
    "namespace": "product_docs",
    "vector_count": 845,
    "estimated_build_time": 8.45,
    "status": "completed",
    "message": "Index created successfully"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 9. optimize_vector_storage

Optimize vector storage for better performance and reduced storage costs.

**Parameters:**
- `project_id` (required): Project UUID
- `strategy` (optional): Optimization strategy - "compression", "deduplication", or "clustering" (default: "compression")

**Returns:**
- `optimized_vectors`: Number of vectors optimized
- `storage_saved_bytes`: Space saved in bytes
- `storage_saved_mb`: Space saved in megabytes
- `optimization_time_ms`: Operation duration
- `strategy`: Strategy used
- `status`: "completed"

**Example Request:**
```json
{
  "operation": "optimize_vector_storage",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "strategy": "compression"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "optimize_vector_storage",
  "result": {
    "optimized_vectors": 1523,
    "storage_saved_bytes": 2845632,
    "storage_saved_mb": 2.71,
    "optimization_time_ms": 1523.45,
    "strategy": "compression",
    "status": "completed"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 10. export_vectors

Export vectors to various formats for backup or analysis.

**Parameters:**
- `project_id` (required): Project UUID
- `namespace` (optional): Filter by namespace
- `format` (optional): Export format - "json", "csv", or "parquet" (default: "json")

**Returns:**
- `download_url`: Presigned URL for download (valid for 1 hour)
- `vector_count`: Number of vectors exported
- `file_size_bytes`: Export file size in bytes
- `file_size_mb`: Export file size in megabytes
- `format`: Export format used
- `expires_in_seconds`: URL expiration time
- `status`: "ready"

**Example Request:**
```json
{
  "operation": "export_vectors",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "namespace": "product_docs",
    "format": "json"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "export_vectors",
  "result": {
    "download_url": "https://storage.zerodb.ai/exports/550e8400.../vectors.json",
    "vector_count": 845,
    "file_size_bytes": 5234567,
    "file_size_mb": 4.99,
    "format": "json",
    "expires_in_seconds": 3600,
    "status": "ready"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

## Quantum Operations (6)

Quantum operations leverage quantum-inspired algorithms for enhanced vector compression, similarity calculation, and optimization.

### 1. quantum_compress_vector

Apply quantum-inspired compression to reduce vector storage while preserving semantic meaning.

**Parameters:**
- `project_id` (required): Project UUID
- `embedding` (required): Vector to compress (list of floats)
- `compression_ratio` (optional): Target compression ratio 0.3-0.8 (default: 0.6)
- `preserve_semantics` (optional): Boolean to preserve semantic accuracy (default: true)

**Returns:**
- `compressed_embedding`: Compressed vector
- `original_size`: Original size in bytes
- `compressed_size`: Compressed size in bytes
- `compression_achieved`: Actual compression ratio
- `space_saved_bytes`: Space saved
- `space_saved_percent`: Percentage saved

**Example Request:**
```json
{
  "operation": "quantum_compress_vector",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "embedding": [0.123, -0.456, 0.789, ...],
    "compression_ratio": 0.6,
    "preserve_semantics": true
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "quantum_compress_vector",
  "result": {
    "compressed_embedding": [0.12, -0.46, 0.79, ...],
    "original_size": 6144,
    "compressed_size": 3686,
    "compression_achieved": 0.6,
    "space_saved_bytes": 2458,
    "space_saved_percent": 40.0
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 2. quantum_decompress_vector

Decompress a quantum-compressed vector.

**Parameters:**
- `project_id` (required): Project UUID
- `compressed_embedding` (required): Compressed vector

**Returns:**
- `embedding`: Decompressed vector
- `quality_score`: Reconstruction quality 0-1 (1.0 = perfect)
- `decompression_time_ms`: Operation duration
- `dimension`: Vector dimension

**Example Request:**
```json
{
  "operation": "quantum_decompress_vector",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "compressed_embedding": [0.12, -0.46, 0.79, ...]
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "quantum_decompress_vector",
  "result": {
    "embedding": [0.123, -0.456, 0.789, ...],
    "quality_score": 0.95,
    "decompression_time_ms": 12.34,
    "dimension": 1536
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 3. quantum_hybrid_similarity

Calculate hybrid similarity score using quantum enhancement and metadata boosting.

**Parameters:**
- `project_id` (required): Project UUID
- `query_vector` (required): Query embedding
- `candidate_vector` (required): Candidate embedding
- `metadata_boost` (optional): Metadata for boosting relevance

**Returns:**
- `similarity_score`: Hybrid similarity score 0-1
- `cosine_component`: Standard cosine similarity contribution
- `quantum_component`: Quantum-enhanced contribution
- `metadata_component`: Metadata boost contribution
- `algorithm`: "quantum_hybrid"

**Example Request:**
```json
{
  "operation": "quantum_hybrid_similarity",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "query_vector": [0.1, 0.2, 0.3, ...],
    "candidate_vector": [0.15, 0.25, 0.35, ...],
    "metadata_boost": {"category": "high_priority"}
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "quantum_hybrid_similarity",
  "result": {
    "similarity_score": 0.8945,
    "cosine_component": 0.7234,
    "quantum_component": 0.1511,
    "metadata_component": 0.02,
    "algorithm": "quantum_hybrid"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 4. quantum_optimize_space

Optimize quantum circuits for project vectors to improve compression efficiency.

**Parameters:**
- `project_id` (required): Project UUID
- `sample_count` (optional): Number of vectors to analyze (default: 100)

**Returns:**
- `optimization_applied`: Boolean indicating success
- `sample_count`: Number of vectors analyzed
- `compression_efficiency`: Estimated efficiency gain
- `circuit_depth`: Optimized circuit depth
- `estimated_storage_savings`: Estimated bytes saved
- `analysis`: Detailed analysis data
- `status`: "optimized"

**Example Request:**
```json
{
  "operation": "quantum_optimize_space",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "sample_count": 100
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "quantum_optimize_space",
  "result": {
    "optimization_applied": true,
    "sample_count": 100,
    "compression_efficiency": 0.62,
    "circuit_depth": 4,
    "estimated_storage_savings": 245632,
    "analysis": {"dimension": 4, "variance": 0.123},
    "status": "optimized"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 5. quantum_feature_map

Apply quantum feature mapping to transform a vector into a quantum feature space.

**Parameters:**
- `project_id` (required): Project UUID
- `embedding` (required): Vector to map

**Returns:**
- `mapped_embedding`: Quantum-mapped vector
- `feature_space_dimension`: Dimension of feature space
- `mapping_time_ms`: Operation duration
- `circuit_depth`: Quantum circuit depth
- `status`: "success"

**Example Request:**
```json
{
  "operation": "quantum_feature_map",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "embedding": [0.1, 0.2, 0.3, ...]
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "quantum_feature_map",
  "result": {
    "mapped_embedding": [0.15, 0.23, 0.31, ...],
    "feature_space_dimension": 1536,
    "mapping_time_ms": 15.67,
    "circuit_depth": 4,
    "status": "success"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 6. quantum_kernel_similarity

Calculate quantum kernel similarity between two vectors.

**Parameters:**
- `project_id` (required): Project UUID
- `vector1` (required): First vector
- `vector2` (required): Second vector

**Returns:**
- `kernel_value`: Quantum kernel similarity score
- `interference_term`: Quantum interference contribution
- `computation_time_ms`: Operation duration
- `algorithm`: "quantum_kernel"
- `status`: "success"

**Example Request:**
```json
{
  "operation": "quantum_kernel_similarity",
  "params": {
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "vector1": [0.1, 0.2, 0.3, ...],
    "vector2": [0.15, 0.25, 0.35, ...]
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "quantum_kernel_similarity",
  "result": {
    "kernel_value": 0.8523,
    "interference_term": 0.0523,
    "computation_time_ms": 8.92,
    "algorithm": "quantum_kernel",
    "status": "success"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

## Memory Operations (3)

Memory operations provide agent-native memory management and context handling.

### 1. store_memory

Store a memory in agent's memory system.

**Parameters:**
- `session_id` (required): Session identifier
- `content` (required): Memory content text
- `role` (required): Message role - "user", "assistant", or "system"
- `metadata` (optional): Additional metadata
- `agent_id` (optional): Agent identifier

**Returns:**
- `success`: Boolean
- `session_id`: Session identifier
- `content_preview`: First 100 characters of content

**Example Request:**
```json
{
  "operation": "store_memory",
  "params": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "User asked about API authentication methods",
    "role": "user",
    "metadata": {"category": "authentication"}
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "store_memory",
  "result": {
    "success": true,
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "content_preview": "User asked about API authentication methods"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 2. search_memory

Search memories using semantic similarity.

**Parameters:**
- `query` (required): Search query text
- `limit` (optional): Maximum results (default: 10)
- `agent_id` (optional): Filter by agent
- `session_id` (optional): Filter by session
- `role` (optional): Filter by role

**Returns:**
- `results`: Array of matching memories with:
  - `content`: Memory content
  - `score`: Similarity score
  - `tags`: Associated tags
  - `timestamp`: Creation time
- `count`: Number of results

**Example Request:**
```json
{
  "operation": "search_memory",
  "params": {
    "query": "API authentication",
    "limit": 5
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "search_memory",
  "result": {
    "results": [
      {
        "content": "User asked about API authentication methods",
        "score": 0.92,
        "tags": ["authentication", "api"],
        "timestamp": "2025-10-14T12:34:56.789Z"
      }
    ],
    "count": 1
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

### 3. get_context

Get conversation context for a session.

**Parameters:**
- `session_id` (required): Session identifier
- `limit` (optional): Maximum messages (default: 50)
- `max_tokens` (optional): Maximum tokens to return

**Returns:**
- `context`: Array of context messages
- `total_tokens`: Token count
- `session_id`: Session identifier

**Example Request:**
```json
{
  "operation": "get_context",
  "params": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "limit": 20
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "operation": "get_context",
  "result": {
    "context": [
      {
        "role": "user",
        "content": "How do I authenticate?",
        "timestamp": "2025-10-14T12:34:56.789Z"
      }
    ],
    "total_tokens": 245,
    "session_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": "2025-10-14T12:34:56.789Z"
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "category": "error_category",
    "status": 400,
    "message": "Technical error message",
    "user_message": "User-friendly error message",
    "timestamp": "2025-10-14T12:34:56.789Z",
    "details": {
      "additional": "context"
    }
  }
}
```

### Error Categories

| Category | HTTP Status | Description |
|----------|-------------|-------------|
| `authentication` | 401 | Authentication credentials missing or invalid |
| `authorization` | 403 | User lacks permission for the requested operation |
| `rate_limit` | 429 | Rate limit exceeded for the user's tier |
| `validation` | 400 | Invalid input parameters or data format |
| `not_found` | 404 | Requested resource does not exist |
| `conflict` | 409 | Operation conflicts with current state |
| `server_error` | 500 | Internal server error occurred |
| `service_unavailable` | 503 | Service temporarily unavailable |
| `timeout` | 504 | Operation timed out |
| `unknown` | 500 | Unknown error occurred |

### Common Error Codes

#### Authentication Errors (401)

```json
{
  "success": false,
  "error": {
    "category": "authentication",
    "status": 401,
    "message": "Invalid authentication token",
    "user_message": "Authentication credentials are missing or invalid. Please provide a valid API key or JWT token.",
    "timestamp": "2025-10-14T12:34:56.789Z"
  }
}
```

**Causes:**
- Missing or invalid API key
- Expired JWT token
- Malformed authentication header

**Solution:**
- Verify API key is correct and active
- Refresh JWT token if expired
- Check authentication header format

---

#### Rate Limit Errors (429)

```json
{
  "success": false,
  "error": {
    "category": "rate_limit",
    "status": 429,
    "message": "Rate limit exceeded",
    "user_message": "Rate limit exceeded. Please try again in 245 seconds.",
    "timestamp": "2025-10-14T12:34:56.789Z",
    "details": {
      "retry_after": 245
    }
  }
}
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1728915296
X-RateLimit-Retry-After: 245
```

**Causes:**
- Exceeded hourly request limit for tier
- Too many requests in short time period

**Solution:**
- Wait for the time specified in `retry_after`
- Implement exponential backoff
- Consider upgrading to higher tier

---

#### Validation Errors (400)

```json
{
  "success": false,
  "error": {
    "category": "validation",
    "status": 400,
    "message": "Missing required field: project_id",
    "user_message": "Invalid input: Missing required field: project_id",
    "timestamp": "2025-10-14T12:34:56.789Z",
    "details": {
      "field": "project_id"
    }
  }
}
```

**Causes:**
- Missing required parameters
- Invalid parameter types
- Out-of-range values

**Solution:**
- Check API documentation for required fields
- Validate parameter types before sending
- Ensure values are within acceptable ranges

---

#### Not Found Errors (404)

```json
{
  "success": false,
  "error": {
    "category": "not_found",
    "status": 404,
    "message": "Vector not found: vec_123",
    "user_message": "The requested vector could not be found.",
    "timestamp": "2025-10-14T12:34:56.789Z",
    "details": {
      "resource": "vector",
      "resource_id": "vec_123"
    }
  }
}
```

**Causes:**
- Resource doesn't exist
- Resource was deleted
- Wrong project context

**Solution:**
- Verify resource ID is correct
- Check if resource was deleted
- Ensure using correct project_id

---

#### Server Errors (500)

```json
{
  "success": false,
  "error": {
    "category": "server_error",
    "status": 500,
    "message": "Error in upsert_vector: Database connection failed",
    "user_message": "An internal server error occurred. Please try again later or contact support if the issue persists.",
    "timestamp": "2025-10-14T12:34:56.789Z",
    "details": {
      "operation": "upsert_vector",
      "exception_type": "DatabaseConnectionError"
    }
  }
}
```

**Causes:**
- Database connection issues
- Internal service failures
- Unexpected exceptions

**Solution:**
- Retry the request after a delay
- Contact support if persistent
- Check system status page

---

### Error Handling Best Practices

#### 1. Implement Retry Logic

```python
import time
import requests

def execute_with_retry(operation, params, max_retries=3):
    """Execute operation with exponential backoff retry"""

    for attempt in range(max_retries):
        try:
            response = requests.post(
                "https://api.zerodb.ai/v1/mcp/execute",
                headers={"X-API-Key": api_key},
                json={"operation": operation, "params": params}
            )

            if response.status_code == 429:
                # Rate limited - respect retry-after header
                retry_after = int(response.headers.get('Retry-After', 60))
                time.sleep(retry_after)
                continue

            if response.status_code >= 500:
                # Server error - exponential backoff
                wait_time = 2 ** attempt
                time.sleep(wait_time)
                continue

            return response.json()

        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)

    raise Exception(f"Max retries exceeded for operation: {operation}")
```

#### 2. Handle Rate Limits Gracefully

```python
class RateLimitHandler:
    """Handle rate limits with token bucket algorithm"""

    def __init__(self, tier="free"):
        self.limits = {"free": 100, "pro": 1000, "enterprise": 10000}
        self.limit = self.limits[tier]
        self.tokens = self.limit
        self.last_reset = time.time()

    def can_proceed(self):
        """Check if request can proceed"""
        now = time.time()

        # Reset tokens every hour
        if now - self.last_reset >= 3600:
            self.tokens = self.limit
            self.last_reset = now

        if self.tokens > 0:
            self.tokens -= 1
            return True

        return False

    def wait_time(self):
        """Calculate wait time until next token available"""
        now = time.time()
        time_since_reset = now - self.last_reset
        time_until_reset = 3600 - time_since_reset
        return max(0, time_until_reset)
```

#### 3. Log and Monitor Errors

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger('zerodb_client')

def execute_with_logging(operation, params):
    """Execute operation with comprehensive logging"""

    start_time = time.time()

    try:
        logger.info(f"Executing operation: {operation}")
        response = requests.post(
            "https://api.zerodb.ai/v1/mcp/execute",
            headers={"X-API-Key": api_key},
            json={"operation": operation, "params": params}
        )

        duration_ms = (time.time() - start_time) * 1000

        if not response.json().get("success"):
            error = response.json().get("error", {})
            logger.error(
                f"Operation failed: {operation}",
                extra={
                    "operation": operation,
                    "error_category": error.get("category"),
                    "status": error.get("status"),
                    "duration_ms": duration_ms
                }
            )
        else:
            logger.info(
                f"Operation succeeded: {operation}",
                extra={
                    "operation": operation,
                    "duration_ms": duration_ms
                }
            )

        return response.json()

    except Exception as e:
        logger.exception(f"Exception in operation: {operation}")
        raise
```

---

## Rate Limiting

### Tier-Based Limits

ZeroDB enforces rate limits based on user subscription tier:

| Tier | Requests/Hour | Burst Limit/Minute | Recommended Use Case |
|------|---------------|-------------------|----------------------|
| **Free** | 100 | 10 | Development, testing, small projects |
| **Pro** | 1,000 | 50 | Production applications, medium traffic |
| **Enterprise** | 10,000 | 500 | High-volume production, enterprise apps |

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1728915296
X-RateLimit-Tier: free
```

**Header Definitions:**
- `X-RateLimit-Limit`: Maximum requests allowed in current window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
- `X-RateLimit-Tier`: Current user tier

### Handling Rate Limit Errors

When you exceed the rate limit, you'll receive a 429 response:

```json
{
  "success": false,
  "error": {
    "category": "rate_limit",
    "status": 429,
    "message": "Rate limit exceeded",
    "user_message": "Rate limit exceeded. Please try again in 245 seconds.",
    "timestamp": "2025-10-14T12:34:56.789Z",
    "details": {
      "retry_after": 245
    }
  }
}
```

**Additional Headers:**
```
Retry-After: 245
X-RateLimit-Retry-After: 245
```

### Best Practices for Rate Limiting

#### 1. Monitor Rate Limit Headers

```python
def check_rate_limit(response):
    """Monitor rate limit status from response headers"""

    limit = int(response.headers.get('X-RateLimit-Limit', 0))
    remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
    reset_time = int(response.headers.get('X-RateLimit-Reset', 0))

    # Calculate usage percentage
    usage_percent = ((limit - remaining) / limit) * 100 if limit > 0 else 0

    # Warn if approaching limit
    if usage_percent > 80:
        logger.warning(
            f"Approaching rate limit: {remaining}/{limit} requests remaining"
        )

    return {
        "limit": limit,
        "remaining": remaining,
        "reset_time": reset_time,
        "usage_percent": usage_percent
    }
```

#### 2. Implement Request Throttling

```python
import time
from collections import deque

class RequestThrottler:
    """Throttle requests to stay within rate limits"""

    def __init__(self, max_requests_per_hour):
        self.max_requests = max_requests_per_hour
        self.request_times = deque()

    def wait_if_needed(self):
        """Wait if necessary to stay within rate limit"""

        now = time.time()
        one_hour_ago = now - 3600

        # Remove requests older than 1 hour
        while self.request_times and self.request_times[0] < one_hour_ago:
            self.request_times.popleft()

        # Check if at limit
        if len(self.request_times) >= self.max_requests:
            # Calculate wait time
            oldest_request = self.request_times[0]
            wait_time = oldest_request + 3600 - now

            if wait_time > 0:
                logger.info(f"Rate limit reached. Waiting {wait_time:.2f}s")
                time.sleep(wait_time)

        # Record this request
        self.request_times.append(time.time())

# Usage
throttler = RequestThrottler(max_requests_per_hour=100)

def execute_throttled(operation, params):
    throttler.wait_if_needed()
    return execute_operation(operation, params)
```

#### 3. Use Batch Operations

Instead of making multiple individual requests, use batch operations to reduce API calls:

```python
# Bad: Multiple individual requests
for vector in vectors:
    execute_operation("upsert_vector", {
        "project_id": project_id,
        "embedding": vector["embedding"],
        "document": vector["document"]
    })

# Good: Single batch request
execute_operation("batch_upsert_vectors", {
    "project_id": project_id,
    "vectors": vectors
})
```

#### 4. Implement Caching

Cache frequently accessed data to reduce API calls:

```python
import functools
import time

def cache_with_ttl(ttl_seconds=300):
    """Cache decorator with time-to-live"""

    def decorator(func):
        cache = {}

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key
            key = str(args) + str(kwargs)

            # Check cache
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < ttl_seconds:
                    return result

            # Execute and cache
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())

            return result

        return wrapper
    return decorator

@cache_with_ttl(ttl_seconds=300)  # Cache for 5 minutes
def get_project_stats(project_id):
    """Get project stats with caching"""
    return execute_operation("get_project_stats", {
        "project_id": project_id
    })
```

---

## Best Practices

### 1. Batch Operations for Efficiency

**Problem:** Making individual API calls for each vector is slow and wastes rate limit quota.

**Solution:** Use batch operations to insert/update multiple vectors in a single request.

```python
# Bad: 100 API calls
for doc in documents:
    execute_operation("upsert_vector", {
        "project_id": project_id,
        "embedding": generate_embedding(doc),
        "document": doc
    })

# Good: 1 API call
vectors = [
    {
        "embedding": generate_embedding(doc),
        "document": doc,
        "metadata": {"source": "batch_import"}
    }
    for doc in documents
]

execute_operation("batch_upsert_vectors", {
    "project_id": project_id,
    "vectors": vectors
})
```

**Benefits:**
- 100x reduction in API calls
- Faster overall execution
- More efficient rate limit usage

---

### 2. Caching Strategies

**Implement Multi-Level Caching:**

```python
import redis
import pickle
from functools import wraps

class CacheManager:
    """Multi-level cache with in-memory and Redis"""

    def __init__(self, redis_client=None):
        self.memory_cache = {}
        self.redis_client = redis_client

    def get(self, key):
        """Get from cache (memory first, then Redis)"""

        # Check memory cache
        if key in self.memory_cache:
            value, expires_at = self.memory_cache[key]
            if time.time() < expires_at:
                return value
            del self.memory_cache[key]

        # Check Redis cache
        if self.redis_client:
            cached = self.redis_client.get(key)
            if cached:
                return pickle.loads(cached)

        return None

    def set(self, key, value, ttl=300):
        """Set in cache (both memory and Redis)"""

        # Set in memory cache
        expires_at = time.time() + ttl
        self.memory_cache[key] = (value, expires_at)

        # Set in Redis cache
        if self.redis_client:
            self.redis_client.setex(
                key,
                ttl,
                pickle.dumps(value)
            )

# Usage
cache = CacheManager(redis_client=redis.Redis())

def cached_search(query_vector, project_id):
    """Search with caching"""

    # Create cache key
    cache_key = f"search:{project_id}:{hash(str(query_vector))}"

    # Check cache
    cached_result = cache.get(cache_key)
    if cached_result:
        return cached_result

    # Execute search
    result = execute_operation("search_vectors", {
        "project_id": project_id,
        "query_vector": query_vector
    })

    # Cache result (5 minute TTL)
    cache.set(cache_key, result, ttl=300)

    return result
```

---

### 3. Error Retry Logic

**Implement Smart Retry with Exponential Backoff:**

```python
import random
import time
from typing import Callable, Any

class RetryStrategy:
    """Advanced retry strategy with exponential backoff and jitter"""

    def __init__(
        self,
        max_retries=3,
        base_delay=1,
        max_delay=60,
        exponential_base=2,
        jitter=True
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter

    def should_retry(self, error: dict, attempt: int) -> bool:
        """Determine if error is retryable"""

        if attempt >= self.max_retries:
            return False

        # Retry on rate limits and server errors
        retryable_statuses = [429, 500, 502, 503, 504]
        status = error.get("error", {}).get("status")

        return status in retryable_statuses

    def calculate_delay(self, attempt: int, error: dict) -> float:
        """Calculate delay before next retry"""

        # For rate limits, use retry-after header
        if error.get("error", {}).get("category") == "rate_limit":
            retry_after = error.get("error", {}).get("details", {}).get("retry_after", 60)
            return retry_after

        # Exponential backoff for other errors
        delay = min(
            self.base_delay * (self.exponential_base ** attempt),
            self.max_delay
        )

        # Add jitter to prevent thundering herd
        if self.jitter:
            delay = delay * (0.5 + random.random() * 0.5)

        return delay

    def execute_with_retry(self, operation: str, params: dict) -> dict:
        """Execute operation with retry logic"""

        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                result = execute_operation(operation, params)

                # Check for errors in response
                if not result.get("success"):
                    if self.should_retry(result, attempt):
                        delay = self.calculate_delay(attempt, result)
                        logger.warning(
                            f"Retry attempt {attempt + 1}/{self.max_retries} "
                            f"after {delay:.2f}s for {operation}"
                        )
                        time.sleep(delay)
                        continue
                    return result

                return result

            except Exception as e:
                last_error = e
                if attempt < self.max_retries:
                    delay = self.calculate_delay(attempt, {})
                    logger.warning(
                        f"Exception on attempt {attempt + 1}/{self.max_retries}: {e}"
                    )
                    time.sleep(delay)
                    continue
                raise

        if last_error:
            raise last_error

# Usage
retry_strategy = RetryStrategy(max_retries=3)

result = retry_strategy.execute_with_retry("search_vectors", {
    "project_id": project_id,
    "query_vector": query_vector
})
```

---

### 4. Connection Pooling

**Use Connection Pooling for Better Performance:**

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class ZeroDBClient:
    """ZeroDB client with connection pooling"""

    def __init__(self, api_key, endpoint, pool_size=10):
        self.api_key = api_key
        self.endpoint = endpoint

        # Create session with connection pooling
        self.session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            backoff_factor=1,
            respect_retry_after_header=True
        )

        # Configure adapter with connection pool
        adapter = HTTPAdapter(
            pool_connections=pool_size,
            pool_maxsize=pool_size,
            max_retries=retry_strategy
        )

        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Set default headers
        self.session.headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        })

    def execute(self, operation, params):
        """Execute operation using pooled connection"""

        response = self.session.post(
            f"{self.endpoint}/mcp/execute",
            json={
                "operation": operation,
                "params": params
            }
        )

        return response.json()

    def close(self):
        """Close session and cleanup connections"""
        self.session.close()

# Usage
client = ZeroDBClient(
    api_key="your_api_key",
    endpoint="https://api.zerodb.ai/v1",
    pool_size=20
)

try:
    result = client.execute("search_vectors", params)
finally:
    client.close()
```

---

### 5. Async/Parallel Execution

**Execute Multiple Operations in Parallel:**

```python
import asyncio
import aiohttp

class AsyncZeroDBClient:
    """Async ZeroDB client for parallel operations"""

    def __init__(self, api_key, endpoint, max_concurrent=10):
        self.api_key = api_key
        self.endpoint = endpoint
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def execute(self, session, operation, params):
        """Execute single operation"""

        async with self.semaphore:
            async with session.post(
                f"{self.endpoint}/mcp/execute",
                json={"operation": operation, "params": params},
                headers={"X-API-Key": self.api_key}
            ) as response:
                return await response.json()

    async def execute_batch(self, operations):
        """Execute multiple operations in parallel"""

        async with aiohttp.ClientSession() as session:
            tasks = [
                self.execute(session, op["operation"], op["params"])
                for op in operations
            ]
            return await asyncio.gather(*tasks)

# Usage
async def main():
    client = AsyncZeroDBClient(
        api_key="your_api_key",
        endpoint="https://api.zerodb.ai/v1",
        max_concurrent=5
    )

    # Execute multiple searches in parallel
    operations = [
        {
            "operation": "search_vectors",
            "params": {
                "project_id": project_id,
                "query_vector": vector
            }
        }
        for vector in query_vectors
    ]

    results = await client.execute_batch(operations)
    return results

# Run
results = asyncio.run(main())
```

---

## Examples

### Complete Use Case Examples

#### 1. Building a Semantic Search Engine

```python
import openai
from ainative.zerodb import ZeroDBClient

class SemanticSearchEngine:
    """Semantic search engine using ZeroDB"""

    def __init__(self, api_key, project_id):
        self.client = ZeroDBClient(api_key=api_key)
        self.project_id = project_id
        self.openai_client = openai.OpenAI()

    def generate_embedding(self, text):
        """Generate embedding for text"""
        response = self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    async def index_documents(self, documents):
        """Index multiple documents"""

        vectors = []
        for doc in documents:
            embedding = self.generate_embedding(doc["text"])
            vectors.append({
                "embedding": embedding,
                "document": doc["text"],
                "metadata": {
                    "title": doc.get("title", ""),
                    "category": doc.get("category", ""),
                    "url": doc.get("url", "")
                }
            })

        # Batch insert
        result = await self.client.execute("batch_upsert_vectors", {
            "project_id": self.project_id,
            "namespace": "search_index",
            "vectors": vectors
        })

        return result

    async def search(self, query, limit=10):
        """Search for relevant documents"""

        # Generate query embedding
        query_embedding = self.generate_embedding(query)

        # Search vectors
        result = await self.client.execute("search_vectors", {
            "project_id": self.project_id,
            "query_vector": query_embedding,
            "limit": limit,
            "threshold": 0.7,
            "namespace": "search_index"
        })

        return result["result"]["results"]

# Usage
engine = SemanticSearchEngine(
    api_key="your_api_key",
    project_id="your_project_id"
)

# Index documents
documents = [
    {
        "text": "ZeroDB is a quantum-enhanced vector database",
        "title": "Introduction to ZeroDB",
        "category": "documentation"
    },
    {
        "text": "Semantic search enables natural language queries",
        "title": "Semantic Search Guide",
        "category": "tutorial"
    }
]

await engine.index_documents(documents)

# Search
results = await engine.search("What is ZeroDB?")
for result in results:
    print(f"Title: {result['metadata']['title']}")
    print(f"Text: {result['document']}")
    print(f"Score: {result['similarity']}")
    print("---")
```

---

#### 2. AI Agent with Long-Term Memory

```python
from ainative.zerodb import ZeroDBClient
import uuid

class AIAgentWithMemory:
    """AI agent with long-term memory using ZeroDB"""

    def __init__(self, api_key, agent_id):
        self.client = ZeroDBClient(api_key=api_key)
        self.agent_id = agent_id
        self.session_id = str(uuid.uuid4())

    async def store_interaction(self, user_message, agent_response):
        """Store interaction in memory"""

        # Store user message
        await self.client.execute("store_memory", {
            "session_id": self.session_id,
            "content": user_message,
            "role": "user",
            "metadata": {
                "agent_id": self.agent_id,
                "timestamp": datetime.now().isoformat()
            }
        })

        # Store agent response
        await self.client.execute("store_memory", {
            "session_id": self.session_id,
            "content": agent_response,
            "role": "assistant",
            "metadata": {
                "agent_id": self.agent_id,
                "timestamp": datetime.now().isoformat()
            }
        })

    async def recall_relevant_memories(self, query, limit=5):
        """Recall relevant past interactions"""

        result = await self.client.execute("search_memory", {
            "query": query,
            "limit": limit,
            "agent_id": self.agent_id
        })

        return result["result"]["results"]

    async def get_conversation_context(self, max_messages=20):
        """Get recent conversation context"""

        result = await self.client.execute("get_context", {
            "session_id": self.session_id,
            "limit": max_messages
        })

        return result["result"]["context"]

    async def process_message(self, user_message):
        """Process user message with context"""

        # Recall relevant memories
        relevant_memories = await self.recall_relevant_memories(user_message)

        # Get conversation context
        conversation_context = await self.get_conversation_context()

        # Build context for LLM
        context = "Relevant past interactions:\n"
        for memory in relevant_memories:
            context += f"- {memory['content']}\n"

        context += "\nRecent conversation:\n"
        for msg in conversation_context[-5:]:
            context += f"{msg['role']}: {msg['content']}\n"

        # Generate response (using your LLM of choice)
        agent_response = generate_response(context, user_message)

        # Store interaction
        await self.store_interaction(user_message, agent_response)

        return agent_response

# Usage
agent = AIAgentWithMemory(
    api_key="your_api_key",
    agent_id="agent_123"
)

response = await agent.process_message("What did we discuss yesterday?")
print(response)
```

---

#### 3. Integration with LangChain

```python
from langchain.vectorstores import VectorStore
from langchain.embeddings import OpenAIEmbeddings
from ainative.zerodb import ZeroDBClient

class ZeroDBVectorStore(VectorStore):
    """LangChain integration for ZeroDB"""

    def __init__(self, api_key, project_id, namespace="default"):
        self.client = ZeroDBClient(api_key=api_key)
        self.project_id = project_id
        self.namespace = namespace
        self.embeddings = OpenAIEmbeddings()

    async def add_texts(self, texts, metadatas=None):
        """Add texts to vector store"""

        # Generate embeddings
        embeddings = self.embeddings.embed_documents(texts)

        # Prepare vectors
        vectors = []
        for i, (text, embedding) in enumerate(zip(texts, embeddings)):
            vectors.append({
                "embedding": embedding,
                "document": text,
                "metadata": metadatas[i] if metadatas else {}
            })

        # Batch insert
        result = await self.client.execute("batch_upsert_vectors", {
            "project_id": self.project_id,
            "namespace": self.namespace,
            "vectors": vectors
        })

        return result

    async def similarity_search(self, query, k=4):
        """Search for similar documents"""

        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query)

        # Search
        result = await self.client.execute("search_vectors", {
            "project_id": self.project_id,
            "query_vector": query_embedding,
            "limit": k,
            "namespace": self.namespace
        })

        # Convert to LangChain Document format
        documents = []
        for vec in result["result"]["results"]:
            documents.append(
                Document(
                    page_content=vec["document"],
                    metadata=vec["metadata"]
                )
            )

        return documents

# Usage with LangChain
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

# Create vector store
vectorstore = ZeroDBVectorStore(
    api_key="your_api_key",
    project_id="your_project_id",
    namespace="langchain_docs"
)

# Add documents
await vectorstore.add_texts(
    texts=["Document 1 content", "Document 2 content"],
    metadatas=[{"source": "doc1"}, {"source": "doc2"}]
)

# Create QA chain
qa_chain = RetrievalQA.from_chain_type(
    llm=OpenAI(),
    retriever=vectorstore.as_retriever()
)

# Query
answer = qa_chain.run("What is in document 1?")
print(answer)
```

---

## Support and Resources

### Documentation
- **API Reference**: https://docs.zerodb.ai/api
- **SDK Documentation**: https://docs.zerodb.ai/sdks
- **Tutorials**: https://docs.zerodb.ai/tutorials

### Support Channels
- **Email**: support@zerodb.ai
- **Discord**: https://discord.gg/zerodb
- **GitHub Issues**: https://github.com/ainative/zerodb/issues

### Status and Monitoring
- **Status Page**: https://status.zerodb.ai
- **Service Health**: Check `admin_system_health` operation

### Rate Limit Tier Upgrades
To upgrade your tier and increase rate limits:
1. Log in to https://dashboard.zerodb.ai
2. Navigate to Settings > Billing
3. Select your desired tier (Pro or Enterprise)
4. Rate limit changes take effect immediately

---

## Changelog

### Version 1.0 (October 14, 2025)
- Initial release with 60 operations
- Vector operations (10)
- Quantum operations (6)
- Table operations (8)
- File operations (6)
- Event operations (5)
- Project operations (7)
- RLHF operations (10)
- Memory operations (3)
- Admin operations (5)
- API key and JWT authentication
- Tiered rate limiting
- Comprehensive error handling

---

**End of ZeroDB MCP Server Guide**
