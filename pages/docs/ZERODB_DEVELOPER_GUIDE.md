# ZeroDB Developer Guide

**The AI-Native Database Platform for Building Intelligent Applications**

## 🚀 What is ZeroDB?

ZeroDB is an enterprise-grade, AI-native database platform that seamlessly integrates vector search, MCP (Model Context Protocol) support, and advanced AI features. It's designed for developers building intelligent applications that need to store, search, and manage AI-generated content at scale.

### Key Features:
- **🔍 Vector Search**: PostgreSQL pgvector with HNSW indexing for lightning-fast similarity search
- **🧠 MCP Protocol**: 8192 token context windows for advanced AI agent interactions
- **🔐 Multi-User Support**: Built-in vector locking and conflict resolution
- **📊 Quantum Compression**: 60-96% vector compression without quality loss
- **⚡ High Performance**: Sub-millisecond query times with multi-level caching
- **🌐 REST API**: Complete HTTP API for all operations

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication & API Keys](#authentication--api-keys)
3. [Core Concepts](#core-concepts)
4. [API Integration](#api-integration)
5. [Vector Operations](#vector-operations)
6. [MCP Server & AI Agents](#mcp-server--ai-agents)
7. [Advanced Features](#advanced-features)
8. [Best Practices](#best-practices)
9. [Example Applications](#example-applications)

## 🏃 Quick Start

### Prerequisites
- API access to ZeroDB (get credentials from AINative Studio)
- Basic understanding of vector embeddings
- (Optional) MCP-compatible AI framework for agent development

### 1. Get Your API Credentials

#### Option A: Get an API Key (Recommended for Production)
```bash
# 1. Register for an account
BASE_URL="https://api.ainative.studio/api"

curl -X POST $BASE_URL/v1/public/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@company.com",
    "password": "SecurePassword123!",
    "full_name": "Your Name"
  }'

# 2. Email support@ainative.studio with your registered email
# Subject: "API Key Request for ZeroDB"
# Include: Your email, company name, use case

# 3. Save your API key when received
export ZERODB_API_KEY="your_api_key_here"
```

#### Option B: Use JWT Token (For Testing)
```bash
# Get JWT token (expires in 30 minutes)
AUTH_RESPONSE=$(curl -s -X POST $BASE_URL/v1/public/auth/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=developer@company.com&password=SecurePassword123!")

# Save your token from the response
export ZERODB_TOKEN=$(echo $AUTH_RESPONSE | jq -r '.access_token')
```

### 2. Create Your First Project

```bash
# Option A: With API Key (Recommended)
curl -X POST $BASE_URL/v1/public/projects \
  -H "X-API-Key: $ZERODB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI App",
    "description": "Production AI application",
    "tier": "free",
    "database_enabled": true
  }'

# Option B: With JWT Token (Testing)
curl -X POST $BASE_URL/v1/public/projects \
  -H "Authorization: Bearer $ZERODB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI App", 
    "description": "Production AI application",
    "tier": "free",
    "database_enabled": true
  }'

# Save the project ID from response
export PROJECT_ID="your_project_id_here"
```

### 3. Store Your First Vector

```bash
# Create a 1536-dimensional vector (OpenAI embedding size)
# Note: All vector operations are scoped to projects
curl -X POST $BASE_URL/v1/public/projects/$PROJECT_ID/database/vectors/upsert \
  -H "X-API-Key: $ZERODB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "documents",
    "embedding": [0.1, 0.2, 0.3], 
    "document": "This is my first document in ZeroDB",
    "source": "api",
    "metadata": {
      "type": "tutorial",
      "author": "developer"
    }
  }'
```

## 🔐 Authentication & API Keys

### Authentication Options

ZeroDB supports two authentication methods:

#### 1. JWT Tokens (Quick Start)
- **Best for**: Testing, development, temporary access
- **Duration**: 30 minutes (1800 seconds)
- **Pros**: Immediate access after registration
- **Cons**: Expire frequently, not suitable for production

#### 2. API Keys (Production)
- **Best for**: Production applications, CI/CD, long-running services
- **Duration**: Never expire (unless manually revoked)
- **Pros**: Persistent, secure, perfect for development
- **Cons**: Requires admin approval

### 🎯 Getting a Production API Key

For production use and better developer experience, request a persistent API key:

#### Step 1: Register Your Account
```bash
# Register first (same as Quick Start)
BASE_URL="https://api.ainative.studio/api"

curl -X POST $BASE_URL/v1/public/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@company.com",
    "password": "SecurePassword123!",
    "full_name": "Your Name"
  }'
```

#### Step 2: Request API Key Access
Contact the AINative Studio team to get your API key:

**📧 Email**: support@ainative.studio  
**📝 Subject**: API Key Request for ZeroDB  
**📋 Include**:
- Your registered email address
- Company/organization name
- Intended use case (development, production, etc.)
- Estimated API usage (requests per day/month)

#### Step 3: Receive Your API Key
You'll receive an API key in this format:
```
ZERODB_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Security Note**: Store your API key securely and never commit it to version control.

### 🔧 Using Authentication (API Keys + JWT)

**🎉 Both API keys and JWT tokens are now supported!**

#### Recommended Method: API Keys (Production)
```bash
# Get your API key from support@ainative.studio
export ZERODB_API_KEY="your_api_key_here"

# Use in requests (X-API-Key header)
curl -H "X-API-Key: $ZERODB_API_KEY" \
  $BASE_URL/v1/public/projects
```

#### Alternative Method: JWT Tokens (Testing)
```bash
# Get JWT token (expires in 30 minutes)
AUTH_RESPONSE=$(curl -s -X POST $BASE_URL/v1/public/auth/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your@email.com&password=yourpassword")

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.access_token')

# Use in requests  
curl -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/v1/public/projects
```

#### Request Headers Comparison

**Recommended: API Key (persistent)**:
```bash
curl -H "X-API-Key: your_api_key_here" \
  $BASE_URL/api/v1/public/users/me
```

**Alternative: JWT Token (30-min expiration)**:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  $BASE_URL/api/v1/public/users/me
```

### 🛠️ API Key Management

#### Check API Key Status
```bash
# Verify your API key is working
curl -H "X-API-Key: $ZERODB_API_KEY" \
  $BASE_URL/api/v1/public/auth/me

# Expected response includes your user information
```

#### API Key Features
- **🔐 Secure**: 256-bit URL-safe tokens with SHA-256 hashing
- **📊 Usage Tracking**: Monitor API calls and last usage
- **⏰ No Expiration**: Works indefinitely unless revoked
- **🔄 Rotation**: Contact support to rotate keys if compromised
- **📈 Analytics**: View usage statistics through admin portal

### 🚨 Current Implementation Status

**✅ Available Now**:
- JWT token authentication (30-minute expiration)
- **API key authentication (X-API-Key header support)**
- **Flexible authentication (both JWT + API key)**
- User registration and login system  
- Complete API key management system (admin-only)
- API key generation, rotation, and revocation
- Secure API key storage with SHA-256 hashing

**✅ Recently Deployed**:
- **Production endpoints now support API key authentication**
- **X-API-Key header validation working**
- **All developer-facing endpoints updated**

**❌ Not Yet Available**:
- User self-service API key generation (admin-managed only)
- Public API key management dashboard

**🎉 Current Status**:
**API key authentication is now FULLY WORKING in production!**

✅ **What Works Right Now**:
- **X-API-Key header authentication on all public endpoints**
- JWT token authentication (backward compatible)
- Admin can create API keys via `/api/v1/admin/api-keys` endpoints
- API keys are securely stored and hashed in the database  
- Authentication middleware is deployed and functional

✅ **Confirmed Working Endpoints**:
- `GET /api/v1/public/auth/me` ✅
- `GET /api/v1/public/users/me` ✅
- `GET /api/v1/public/projects/` ✅
- `POST /api/v1/public/projects/` ✅
- `POST /api/v1/public/projects/{id}/database/vectors/upsert` ✅

**📞 To Get Your API Key**:
Contact support@ainative.studio with your registered email address to receive a production API key.

### 💡 Development Best Practices

#### 1. Environment-Based Configuration
```bash
# .env.development
ZERODB_API_KEY="ZERODB_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
ZERODB_BASE_URL="https://core-production-31c8.up.railway.app"

# .env.production  
ZERODB_API_KEY="ZERODB_prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
ZERODB_BASE_URL="https://core-production-31c8.up.railway.app"
```

#### 2. SDK Configuration
```python
import os
from zerodb_client import ZeroDBClient

# Automatic API key detection
client = ZeroDBClient(
    api_key=os.getenv('ZERODB_API_KEY'),
    base_url=os.getenv('ZERODB_BASE_URL', 'https://core-production-31c8.up.railway.app')
)
```

#### 3. Error Handling
```python
def make_api_request():
    headers = {'X-API-Key': os.getenv('ZERODB_API_KEY')}
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/public/users/me", headers=headers)
        
        if response.status_code == 401:
            raise Exception("Invalid API key - please check your credentials")
        elif response.status_code == 403:
            raise Exception("API key lacks required permissions")
        
        return response.json()
    except requests.RequestException as e:
        raise Exception(f"API request failed: {e}")
```

### 📞 Support & Troubleshooting

**API Key Issues**:
- **Invalid Key**: Check key format and environment variables
- **Permission Denied**: Contact support to verify key permissions  
- **Rate Limiting**: Monitor response headers for rate limit status

**Contact Information**:
- **Email**: support@ainative.studio
- **Documentation**: https://core-production-31c8.up.railway.app/docs
- **Status Page**: https://core-production-31c8.up.railway.app/health

## 🧩 Core Concepts

### Projects
Projects are top-level containers that organize your data. Each project has:
- Unique identifier (UUID)
- Isolated vector namespace
- Configurable settings
- Access control

### Vectors
Vectors in ZeroDB are:
- **1536-dimensional** by default (compatible with OpenAI embeddings)
- Stored with **pgvector** for efficient similarity search
- Indexed with **HNSW** for sub-millisecond queries
- Associated with documents and metadata

### Namespaces
Within a project, use namespaces to organize vectors:
- `documents` - For document embeddings
- `conversations` - For chat/conversation history
- `knowledge` - For knowledge base entries
- `custom` - Define your own

### MCP Contexts
Model Context Protocol (MCP) contexts enable:
- **8192 token windows** for large context AI interactions
- Message history management
- Context reconstruction from fragments
- Multi-turn conversations with state

## 🔌 API Integration

### Python SDK Example

```python
import requests
import numpy as np
from typing import List, Dict, Any, Optional

class ZeroDBClient:
    def __init__(self, base_url: str, api_key: Optional[str] = None, token: Optional[str] = None):
        """Initialize ZeroDB client with API key (recommended) or JWT token
        
        Args:
            base_url: ZeroDB API endpoint (e.g., "https://api.ainative.studio/api")
            api_key: Persistent API key - Recommended for production (get from support@ainative.studio)
            token: JWT token (expires in 30 minutes) - For testing only
        """
        self.base_url = base_url
        
        if api_key:
            # Use API key authentication (recommended)
            self.headers = {
                "X-API-Key": api_key,
                "Content-Type": "application/json"
            }
        elif token:
            # Use JWT token (temporary)
            self.headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        else:
            raise ValueError("Either api_key or token must be provided")
    
    def create_project(self, name: str, description: str = "", tier: str = "free") -> Dict:
        """Create a new ZeroDB project"""
        
        data = {
            "name": name,
            "description": description,
            "tier": tier,
            "database_enabled": True
        }
        
        response = requests.post(
            f"{self.base_url}/v1/public/projects",
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def upsert_vector(self, project_id: str, embedding: List[float], 
                     document: str, namespace: str = "default",
                     metadata: Dict[str, Any] = None) -> Dict:
        """Store a vector with its associated document"""
        
        data = {
            "namespace": namespace,
            "embedding": embedding,
            "document": document,
            "source": "python_sdk",
            "metadata": metadata or {}
        }
        
        response = requests.post(
            f"{self.base_url}/v1/public/projects/{project_id}/database/vectors/upsert",
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def search_vectors(self, project_id: str, query_vector: List[float],
                      limit: int = 10, threshold: float = 0.8) -> List[Dict]:
        """Search for similar vectors"""
        
        data = {
            "query_vector": query_vector,
            "limit": limit,
            "threshold": threshold
        }
        
        response = requests.post(
            f"{self.base_url}/v1/public/projects/{project_id}/database/vectors/search",
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def create_event(self, project_id: str, event_type: str, payload: Dict[str, Any], 
                    topic: str = "default") -> Dict:
        """Create an event record for event-driven applications"""
        
        data = {
            "event_type": event_type,
            "topic": topic,
            "payload": payload,
            "source": "python_sdk"
        }
        
        response = requests.post(
            f"{self.base_url}/v1/public/projects/{project_id}/database/events",
            headers=self.headers,
            json=data
        )
        return response.json()

# Usage examples

# Recommended: API Key (Production)
client = ZeroDBClient(
    base_url="https://api.ainative.studio/api",
    api_key="your_api_key_here"  # Get from support@ainative.studio
)

# Alternative: JWT Token (Testing)
client_jwt = ZeroDBClient(
    base_url="https://api.ainative.studio/api",
    token="eyJhbGciOiJIUzI1NiIs..."  # Get from login endpoint
)

# Environment Variables (Best Practice)
import os
client = ZeroDBClient(
    base_url=os.getenv("ZERODB_BASE_URL", "https://api.ainative.studio/api"),
    api_key=os.getenv("ZERODB_API_KEY"),  # API key from environment
    token=os.getenv("ZERODB_TOKEN")       # Fallback to JWT token
)

# Helper function to get JWT token (for testing)
def get_zerodb_token(email: str, password: str) -> str:
    """Get JWT token for authentication (testing only)"""
    import requests
    
    response = requests.post(
        "https://api.ainative.studio/api/v1/auth/login",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data=f"username={email}&password={password}&grant_type=password"
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Login failed: {response.json()}")

# Complete production example
client = ZeroDBClient(
    base_url="https://api.ainative.studio/api",
    api_key=os.getenv("ZERODB_API_KEY")  # Get from support@ainative.studio
)

# Store a vector
result = client.create_vector(
    project_id="your_project_id",
    embedding=[0.1] * 1536,  # Your actual embedding here
    document="Important information about AI",
    namespace="knowledge",
    metadata={"category": "ai", "importance": "high"}
)
```

### JavaScript/TypeScript Example

```typescript
interface ZeroDBClientOptions {
  baseUrl: string;
  apiKey?: string;
  token?: string;
}

class ZeroDBClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: ZeroDBClientOptions) {
    const { baseUrl, apiKey, token } = options;
    this.baseUrl = baseUrl;
    
    if (apiKey) {
      // Use persistent API key (recommended)
      this.headers = {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      };
    } else if (token) {
      // Use JWT token (temporary)
      this.headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } else {
      throw new Error('Either apiKey or token must be provided');
    }
  }

  async createVector(
    projectId: string,
    embedding: number[],
    document: string,
    namespace: string = 'default',
    metadata: Record<string, any> = {}
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/public/v1/vectors/`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        project_id: projectId,
        namespace,
        embedding,
        document,
        source: 'js_sdk',
        metadata
      })
    });
    
    return response.json();
  }

  async searchVectors(
    projectId: string,
    queryVector: number[],
    limit: number = 10,
    threshold: number = 0.8
  ): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/public/v1/vectors/project/${projectId}/search`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          query_vector: queryVector,
          limit,
          threshold
        })
      }
    );
    
    return response.json();
  }
}

// Usage examples

// Option 1: With API Key (Recommended for Production)
const client = new ZeroDBClient({
  baseUrl: 'https://core-production-31c8.up.railway.app',
  apiKey: 'ZERODB_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
});

// Option 2: With JWT Token (Quick Testing Only) 
const clientJWT = new ZeroDBClient({
  baseUrl: 'https://core-production-31c8.up.railway.app',
  token: 'eyJhbGciOiJIUzI1NiIs...'
});

// Option 3: From Environment Variables (Best Practice)
const clientEnv = new ZeroDBClient({
  baseUrl: process.env.ZERODB_BASE_URL || 'https://core-production-31c8.up.railway.app',
  apiKey: process.env.ZERODB_API_KEY,
  token: process.env.ZERODB_TOKEN
});

// Example: Create a vector
try {
  const result = await client.createVector(
    'your_project_id',
    new Array(1536).fill(0.1), // 1536-dimensional vector
    'Important information about AI',
    'knowledge',
    { category: 'ai', importance: 'high' }
  );
  
  console.log('Vector created:', result.vector_id);
} catch (error) {
  console.error('Error creating vector:', error);
}
```

## 📋 Complete API Endpoint Reference

### Core Project Operations
```bash
# Create Project
POST /api/v1/public/projects

# Get Project Details  
GET /api/v1/public/projects/{project_id}

# List Projects
GET /api/v1/public/projects

# Update Project
PATCH /api/v1/public/projects/{project_id}

# Delete Project
DELETE /api/v1/public/projects/{project_id}
```

### Database Operations (All Project-Scoped)
```bash
# Enable Database
POST /api/v1/public/projects/{project_id}/database

# Get Database Status
GET /api/v1/public/projects/{project_id}/database

# Vector Operations
POST /api/v1/public/projects/{project_id}/database/vectors/upsert
POST /api/v1/public/projects/{project_id}/database/vectors/search
POST /api/v1/public/projects/{project_id}/database/vectors/upsert-batch

# Event Operations (for Event-Driven Applications)
POST /api/v1/public/projects/{project_id}/database/events
GET /api/v1/public/projects/{project_id}/database/events

# Memory Operations
POST /api/v1/public/projects/{project_id}/database/memory
POST /api/v1/public/projects/{project_id}/database/memory/search

# Table Operations
POST /api/v1/public/projects/{project_id}/database/tables
GET /api/v1/public/projects/{project_id}/database/tables
GET /api/v1/public/projects/{project_id}/database/tables/{table_name}/rows
POST /api/v1/public/projects/{project_id}/database/tables/{table_name}/rows
```

### Event-Driven Architecture Support

ZeroDB provides full support for event-driven applications like booking systems:

```python
# Example: ZeroSchedule Booking Event Integration
def publish_booking_event(client, project_id, booking_data):
    """Publish a booking event to ZeroDB"""
    
    event_data = {
        "event_type": "booking_created",
        "topic": "bookings",
        "payload": {
            "id": booking_data["id"],
            "userId": booking_data["userId"],
            "clientName": booking_data["clientName"],
            "clientEmail": booking_data["clientEmail"],
            "eventTitle": booking_data["eventTitle"],
            "startTime": booking_data["startTime"],
            "endTime": booking_data["endTime"],
            "status": booking_data["status"],
            "amount": booking_data["amount"],
            "createdAt": booking_data["createdAt"]
        },
        "source": "zeroschedule_app"
    }
    
    response = requests.post(
        f"{client.base_url}/v1/public/projects/{project_id}/database/events",
        headers=client.headers,
        json=event_data
    )
    
    return response.json()

# Example usage for ZeroSchedule
client = ZeroDBClient(
    base_url="https://api.ainative.studio/api",
    api_key="your_api_key_here"
)

# Create booking event
booking_event = publish_booking_event(client, "your_project_id", {
    "id": "booking_123",
    "userId": "user_demo", 
    "clientName": "John Smith",
    "clientEmail": "john@example.com",
    "eventTitle": "Strategy Consultation",
    "startTime": "2025-09-01T15:00:00Z",
    "endTime": "2025-09-01T16:00:00Z",
    "status": "confirmed",
    "amount": 150,
    "createdAt": "2025-08-28T12:00:00Z"
})
```

## 🔍 Vector Operations

### Storing Vectors with Documents

```python
# Example: Store embeddings from OpenAI
import openai

def store_document_embedding(client, project_id, text):
    # Generate embedding using OpenAI
    response = openai.Embedding.create(
        input=text,
        model="text-embedding-ada-002"
    )
    embedding = response['data'][0]['embedding']
    
    # Store in ZeroDB
    result = client.create_vector(
        project_id=project_id,
        embedding=embedding,
        document=text,
        namespace="documents",
        metadata={
            "timestamp": datetime.now().isoformat(),
            "model": "text-embedding-ada-002"
        }
    )
    return result
```

### Similarity Search

```python
def semantic_search(client, project_id, query_text, limit=5):
    # Generate query embedding
    response = openai.Embedding.create(
        input=query_text,
        model="text-embedding-ada-002"
    )
    query_embedding = response['data'][0]['embedding']
    
    # Search in ZeroDB
    results = client.search_vectors(
        project_id=project_id,
        query_vector=query_embedding,
        limit=limit,
        threshold=0.7  # Adjust based on your needs
    )
    
    return results
```

### Advanced Vector Operations

```python
# Batch vector operations for efficiency
def batch_store_vectors(client, project_id, documents):
    """Store multiple vectors efficiently"""
    
    for doc in documents:
        # Generate embedding
        embedding = generate_embedding(doc['text'])
        
        # Store with metadata
        client.create_vector(
            project_id=project_id,
            embedding=embedding,
            document=doc['text'],
            namespace=doc.get('namespace', 'default'),
            metadata={
                'id': doc['id'],
                'title': doc.get('title', ''),
                'tags': doc.get('tags', []),
                'created_at': doc.get('created_at', datetime.now().isoformat())
            }
        )
```

## 🤖 MCP Server & AI Agents

### What is MCP (Model Context Protocol)?

MCP is ZeroDB's protocol for managing large AI conversation contexts. It enables:
- **8192 token context windows** (vs typical 4096)
- Automatic context management and compression
- Message history with semantic retrieval
- Multi-agent coordination

### Setting Up MCP for AI Agents

```python
class ZeroDBMCPAgent:
    def __init__(self, client: ZeroDBClient, project_id: str):
        self.client = client
        self.project_id = project_id
        self.session_id = str(uuid.uuid4())
        
    def create_context_window(self):
        """Initialize MCP context for agent conversations"""
        
        response = requests.post(
            f"{self.client.base_url}/api/v1/public/mcp/contexts",
            headers=self.client.headers,
            json={
                "project_id": self.project_id,
                "session_id": self.session_id,
                "max_tokens": 8192,
                "messages_json": []
            }
        )
        return response.json()
    
    def add_message(self, role: str, content: str):
        """Add message to MCP context"""
        
        # First, convert to embedding for semantic storage
        embedding = generate_embedding(content)
        
        # Store in vector database
        self.client.create_vector(
            project_id=self.project_id,
            embedding=embedding,
            document=content,
            namespace="mcp_messages",
            metadata={
                "session_id": self.session_id,
                "role": role,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        # Update MCP context
        response = requests.put(
            f"{self.client.base_url}/api/v1/public/mcp/contexts/{self.session_id}",
            headers=self.client.headers,
            json={
                "add_message": {
                    "role": role,
                    "content": content
                }
            }
        )
        return response.json()
    
    def get_relevant_context(self, query: str, limit: int = 10):
        """Retrieve relevant context for AI response"""
        
        # Search for relevant past messages
        query_embedding = generate_embedding(query)
        
        results = self.client.search_vectors(
            project_id=self.project_id,
            query_vector=query_embedding,
            limit=limit,
            threshold=0.7
        )
        
        # Filter by session
        session_results = [
            r for r in results 
            if r.get('metadata', {}).get('session_id') == self.session_id
        ]
        
        return session_results
```

### Building AI Agents with ZeroDB MCP

```python
class IntelligentAgent:
    def __init__(self, zerodb_client, project_id, llm_client):
        self.db = ZeroDBMCPAgent(zerodb_client, project_id)
        self.llm = llm_client  # Your LLM client (OpenAI, Meta Llama, etc.)
        self.db.create_context_window()
    
    def process_query(self, user_query: str) -> str:
        """Process user query with context-aware responses"""
        
        # 1. Add user message to context
        self.db.add_message("user", user_query)
        
        # 2. Retrieve relevant context
        context = self.db.get_relevant_context(user_query, limit=5)
        
        # 3. Build prompt with context
        prompt = self._build_contextual_prompt(user_query, context)
        
        # 4. Generate response
        response = self.llm.complete(prompt)
        
        # 5. Store agent response
        self.db.add_message("assistant", response)
        
        return response
    
    def _build_contextual_prompt(self, query: str, context: List[Dict]) -> str:
        """Build prompt with relevant context"""
        
        prompt = "Previous relevant context:\n"
        for ctx in context:
            prompt += f"- {ctx['document']}\n"
        
        prompt += f"\nCurrent query: {query}\n"
        prompt += "Please provide a helpful response based on the context."
        
        return prompt
```

### Multi-Agent Coordination Example

```python
class MultiAgentSystem:
    def __init__(self, zerodb_client, project_id):
        self.db = zerodb_client
        self.project_id = project_id
        self.agents = {}
    
    def create_agent(self, agent_id: str, agent_type: str):
        """Create a specialized agent"""
        
        agent = {
            "id": agent_id,
            "type": agent_type,
            "session_id": str(uuid.uuid4()),
            "created_at": datetime.now().isoformat()
        }
        
        # Store agent metadata
        self.db.create_vector(
            project_id=self.project_id,
            embedding=[0.0] * 1536,  # Placeholder embedding
            document=f"Agent {agent_id} of type {agent_type}",
            namespace="agents",
            metadata=agent
        )
        
        self.agents[agent_id] = agent
        return agent
    
    def coordinate_agents(self, task: str):
        """Coordinate multiple agents for complex tasks"""
        
        # 1. Analyze task
        task_embedding = generate_embedding(task)
        
        # 2. Find relevant agents
        agent_results = self.db.search_vectors(
            project_id=self.project_id,
            query_vector=task_embedding,
            limit=3,
            threshold=0.6
        )
        
        # 3. Assign subtasks
        subtasks = self._decompose_task(task)
        results = []
        
        for subtask, agent_data in zip(subtasks, agent_results):
            agent_id = agent_data['metadata']['id']
            result = self._execute_agent_task(agent_id, subtask)
            results.append(result)
        
        # 4. Combine results
        final_result = self._combine_agent_results(results)
        
        # 5. Store coordination result
        self.db.create_vector(
            project_id=self.project_id,
            embedding=task_embedding,
            document=final_result,
            namespace="coordination_results",
            metadata={
                "task": task,
                "agents_used": [a['metadata']['id'] for a in agent_results],
                "timestamp": datetime.now().isoformat()
            }
        )
        
        return final_result
```

## 🚀 Advanced Features

### 1. Quantum Vector Compression

ZeroDB supports advanced compression for storing large numbers of vectors efficiently:

```python
def store_compressed_vector(client, project_id, embedding, document):
    """Store vector with quantum compression"""
    
    response = requests.post(
        f"{client.base_url}/api/v1/public/v1/vectors/compressed",
        headers=client.headers,
        json={
            "project_id": project_id,
            "embedding": embedding,
            "document": document,
            "compression_method": "quantum_harmonic",  # 60-96% compression
            "namespace": "compressed_vectors"
        }
    )
    return response.json()
```

### 2. Vector Clustering

Group similar vectors automatically:

```python
def cluster_vectors(client, project_id, namespace, num_clusters=5):
    """Cluster vectors using K-means"""
    
    response = requests.post(
        f"{client.base_url}/api/v1/public/v1/vectors/cluster",
        headers=client.headers,
        json={
            "project_id": project_id,
            "namespace": namespace,
            "algorithm": "kmeans",
            "num_clusters": num_clusters
        }
    )
    return response.json()
```

### 3. Multi-User Vector Locking

For collaborative applications:

```python
def acquire_vector_lock(client, vector_id, user_id, lock_type="write"):
    """Acquire lock for vector modification"""
    
    response = requests.post(
        f"{client.base_url}/api/v1/public/v1/vectors/locks",
        headers=client.headers,
        json={
            "vector_id": vector_id,
            "user_id": user_id,
            "lock_type": lock_type,  # read, write, exclusive
            "duration_seconds": 300  # 5 minutes
        }
    )
    return response.json()
```

## 📊 Best Practices

### 1. Embedding Generation
- Use consistent embedding models (e.g., OpenAI's text-embedding-ada-002)
- Normalize embeddings before storage for better similarity results
- Cache embeddings to reduce API calls

### 2. Namespace Organization
```python
# Good namespace structure
namespaces = {
    "documents": "User documents and files",
    "conversations": "Chat history and messages",
    "knowledge": "Curated knowledge base",
    "feedback": "User feedback and annotations",
    "system": "System-generated content"
}
```

### 3. Metadata Design
```python
# Effective metadata structure
metadata = {
    "id": "unique_identifier",
    "type": "document|conversation|knowledge",
    "source": "api|upload|generated",
    "timestamp": "2024-01-20T10:00:00Z",
    "user_id": "user_who_created",
    "tags": ["ai", "tutorial", "important"],
    "version": 1,
    "parent_id": "for_hierarchical_data",
    "properties": {
        "custom": "values"
    }
}
```

### 4. Query Optimization
- Use appropriate thresholds (0.7-0.9 for high similarity)
- Limit results to improve performance
- Use namespaces to narrow search scope
- Implement pagination for large result sets

### 5. Error Handling
```python
def safe_vector_operation(client, operation, **kwargs):
    """Wrapper for safe vector operations"""
    
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            result = operation(**kwargs)
            return result
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
                continue
            else:
                logger.error(f"Operation failed after {max_retries} attempts: {e}")
                raise
```

## 🏗️ Example Applications

### 1. Semantic Search Engine

```python
class SemanticSearchEngine:
    def __init__(self, zerodb_client, project_id):
        self.db = zerodb_client
        self.project_id = project_id
    
    def index_documents(self, documents):
        """Index documents for semantic search"""
        
        for doc in documents:
            embedding = generate_embedding(doc['content'])
            
            self.db.create_vector(
                project_id=self.project_id,
                embedding=embedding,
                document=doc['content'],
                namespace="search_index",
                metadata={
                    "title": doc['title'],
                    "url": doc['url'],
                    "date": doc['date']
                }
            )
    
    def search(self, query, filters=None):
        """Perform semantic search"""
        
        query_embedding = generate_embedding(query)
        
        results = self.db.search_vectors(
            project_id=self.project_id,
            query_vector=query_embedding,
            limit=20,
            threshold=0.75
        )
        
        # Apply filters if provided
        if filters:
            results = [
                r for r in results
                if all(r['metadata'].get(k) == v for k, v in filters.items())
            ]
        
        return results
```

### 2. AI Chat Assistant with Memory

```python
class MemoryAIChatAssistant:
    def __init__(self, zerodb_client, project_id, llm_client):
        self.db = zerodb_client
        self.project_id = project_id
        self.llm = llm_client
        self.conversation_id = str(uuid.uuid4())
    
    def chat(self, user_message):
        """Process chat with long-term memory"""
        
        # Store user message
        user_embedding = generate_embedding(user_message)
        self.db.create_vector(
            project_id=self.project_id,
            embedding=user_embedding,
            document=user_message,
            namespace="chat_history",
            metadata={
                "conversation_id": self.conversation_id,
                "role": "user",
                "timestamp": datetime.now().isoformat()
            }
        )
        
        # Retrieve relevant past conversations
        relevant_history = self.db.search_vectors(
            project_id=self.project_id,
            query_vector=user_embedding,
            limit=5,
            threshold=0.8
        )
        
        # Build context-aware prompt
        context = "\n".join([h['document'] for h in relevant_history])
        prompt = f"""
        Relevant conversation history:
        {context}
        
        Current user message: {user_message}
        
        Please provide a helpful response considering the conversation history.
        """
        
        # Generate response
        ai_response = self.llm.complete(prompt)
        
        # Store AI response
        response_embedding = generate_embedding(ai_response)
        self.db.create_vector(
            project_id=self.project_id,
            embedding=response_embedding,
            document=ai_response,
            namespace="chat_history",
            metadata={
                "conversation_id": self.conversation_id,
                "role": "assistant",
                "timestamp": datetime.now().isoformat()
            }
        )
        
        return ai_response
```

### 3. Knowledge Graph Builder

```python
class KnowledgeGraphBuilder:
    def __init__(self, zerodb_client, project_id):
        self.db = zerodb_client
        self.project_id = project_id
    
    def add_entity(self, entity_name, entity_type, properties):
        """Add entity to knowledge graph"""
        
        entity_text = f"{entity_type}: {entity_name} - {json.dumps(properties)}"
        entity_embedding = generate_embedding(entity_text)
        
        result = self.db.create_vector(
            project_id=self.project_id,
            embedding=entity_embedding,
            document=entity_text,
            namespace="knowledge_graph",
            metadata={
                "entity_type": entity_type,
                "entity_name": entity_name,
                "properties": properties,
                "connections": []
            }
        )
        
        return result['vector_id']
    
    def connect_entities(self, entity1_id, entity2_id, relationship):
        """Create relationship between entities"""
        
        # This would update the metadata to include connections
        # Implementation depends on your specific needs
        pass
    
    def find_related_entities(self, entity_name, relationship_type=None):
        """Find entities related to given entity"""
        
        query_text = f"Find entities related to {entity_name}"
        if relationship_type:
            query_text += f" with relationship {relationship_type}"
        
        query_embedding = generate_embedding(query_text)
        
        results = self.db.search_vectors(
            project_id=self.project_id,
            query_vector=query_embedding,
            limit=10,
            threshold=0.7
        )
        
        return results
```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Authentication Errors**
   ```python
   # Make sure to use correct header format
   headers = {"Authorization": f"Bearer {token}"}  # Note the space after Bearer
   ```

2. **Vector Dimension Mismatch**
   ```python
   # Always ensure 1536 dimensions
   assert len(embedding) == 1536, f"Expected 1536 dimensions, got {len(embedding)}"
   ```

3. **Rate Limiting**
   ```python
   # Implement exponential backoff
   def with_rate_limit_retry(func):
       def wrapper(*args, **kwargs):
           for i in range(5):
               try:
                   return func(*args, **kwargs)
               except requests.exceptions.HTTPError as e:
                   if e.response.status_code == 429:
                       time.sleep(2 ** i)
                   else:
                       raise
           raise Exception("Max retries exceeded")
       return wrapper
   ```

## 📚 Additional Resources

- **API Documentation**: https://api.ainative.studio/api/docs
- **OpenAPI Spec**: https://api.ainative.studio/api/v1/openapi.json
- **Architecture Guide**: See ZERODB_ARCHITECTURE.md
- **MCP Protocol Spec**: See ZBMCP.md

## 🎯 Next Steps

1. **Set up your development environment** with API credentials
2. **Create your first project** and store some test vectors
3. **Experiment with similarity search** using your own data
4. **Build an MCP-enabled agent** for intelligent interactions
5. **Join our community** for support and best practices

---

**Ready to build intelligent applications with ZeroDB?** Start with the examples above and scale to production with our enterprise features!

For support, contact: support@ainative.studio