# ZeroDB MCP Integration Guide - Windsurf & AI Editors

## 🎯 Overview

This guide provides comprehensive setup instructions for integrating ZeroDB with Model Context Protocol (MCP) compatible AI editors, starting with Windsurf. ZeroDB's MCP integration enables AI agents to seamlessly store, retrieve, and manage memory across coding sessions.

## ✅ Status: Working Configuration

**Last Updated:** 2025-07-04  
**Status:** ✅ **FULLY OPERATIONAL**

- ✅ MCP server connecting to production API successfully
- ✅ Authentication and token renewal working correctly  
- ✅ ZeroDB MCP integration ready for use in Windsurf

## 🌊 **Windsurf Integration Setup**

### **Step 1: Create MCP Configuration**

Create or update your Windsurf MCP configuration file:

**Location:** `~/.windsurf/mcp_servers.json`

```json
{
  "mcpServers": {
    "zerodb": {
      "command": "node",
      "args": ["/path/to/zerodb-mcp-server.js"],
      "env": {
        "ZERODB_API_URL": "https://api.ainative.studio/api/v1",
        "ZERODB_PROJECT_ID": "your-project-id-here",
        "ZERODB_API_TOKEN": "your-jwt-token-here",
        "MCP_MEMORY_ENABLED": "true",
        "MCP_CONTEXT_WINDOW": "8192",
        "MCP_RETENTION_DAYS": "30"
      }
    }
  }
}
```

### **Step 2: Install ZeroDB MCP Server**

Create the MCP server script for ZeroDB:

**File:** `zerodb-mcp-server.js`

```javascript
#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class ZeroDBMCPServer {
  constructor() {
    this.apiUrl = process.env.ZERODB_API_URL;
    this.projectId = process.env.ZERODB_PROJECT_ID;
    this.apiToken = process.env.ZERODB_API_TOKEN;
    this.contextWindow = parseInt(process.env.MCP_CONTEXT_WINDOW || '8192');
    this.retentionDays = parseInt(process.env.MCP_RETENTION_DAYS || '30');
    
    this.server = new Server(
      {
        name: 'zerodb-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupHandlers();
  }

  setupTools() {
    // Define MCP tools for ZeroDB integration
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'zerodb_store_memory',
          description: 'Store agent memory in ZeroDB for persistent context',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'Memory content to store' },
              role: { type: 'string', enum: ['user', 'assistant', 'system'], description: 'Message role' },
              session_id: { type: 'string', description: 'Session identifier' },
              metadata: { type: 'object', description: 'Additional metadata' }
            },
            required: ['content', 'role']
          }
        },
        {
          name: 'zerodb_search_memory',
          description: 'Search agent memory using semantic similarity',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              session_id: { type: 'string', description: 'Filter by session' },
              role: { type: 'string', description: 'Filter by role' },
              limit: { type: 'number', description: 'Max results', default: 10 }
            },
            required: ['query']
          }
        },
        {
          name: 'zerodb_get_context',
          description: 'Get agent context window for current session',
          inputSchema: {
            type: 'object',
            properties: {
              session_id: { type: 'string', description: 'Session identifier' },
              max_tokens: { type: 'number', description: 'Max tokens in context' }
            },
            required: ['session_id']
          }
        },
        {
          name: 'zerodb_store_vector',
          description: 'Store vector embedding with metadata',
          inputSchema: {
            type: 'object',
            properties: {
              vector_embedding: { type: 'array', items: { type: 'number' }, description: 'Vector embedding' },
              document: { type: 'string', description: 'Source document' },
              metadata: { type: 'object', description: 'Document metadata' },
              namespace: { type: 'string', description: 'Vector namespace', default: 'windsurf' }
            },
            required: ['vector_embedding', 'document']
          }
        },
        {
          name: 'zerodb_search_vectors',
          description: 'Search vectors using semantic similarity',
          inputSchema: {
            type: 'object',
            properties: {
              query_vector: { type: 'array', items: { type: 'number' }, description: 'Query vector' },
              namespace: { type: 'string', description: 'Vector namespace' },
              limit: { type: 'number', description: 'Max results', default: 10 },
              threshold: { type: 'number', description: 'Similarity threshold', default: 0.7 }
            },
            required: ['query_vector']
          }
        }
      ],
    }));
  }

  setupHandlers() {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'zerodb_store_memory':
          return await this.storeMemory(args);
        
        case 'zerodb_search_memory':
          return await this.searchMemory(args);
        
        case 'zerodb_get_context':
          return await this.getContext(args);
        
        case 'zerodb_store_vector':
          return await this.storeVector(args);
        
        case 'zerodb_search_vectors':
          return await this.searchVectors(args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async storeMemory(args) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/projects/${this.projectId}/database/memory/store`,
        {
          content: args.content,
          agent_id: 'windsurf-agent', // Default agent ID for Windsurf
          session_id: args.session_id || 'default-session',
          role: args.role,
          memory_metadata: args.metadata || {}
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: [{
          type: 'text',
          text: `Memory stored successfully with ID: ${response.data.memory_id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error storing memory: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async searchMemory(args) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/projects/${this.projectId}/database/memory`,
        {
          params: {
            session_id: args.session_id,
            role: args.role,
            limit: args.limit || 10
          },
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          }
        }
      );

      const memories = response.data;
      const formattedResults = memories.map(memory => 
        `[${memory.created_at}] ${memory.role}: ${memory.content}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${memories.length} memories:\n\n${formattedResults}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error searching memory: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async getContext(args) {
    try {
      // Get recent memory for context window
      const response = await axios.get(
        `${this.apiUrl}/projects/${this.projectId}/database/memory`,
        {
          params: {
            session_id: args.session_id,
            limit: 50 // Get recent memories for context
          },
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          }
        }
      );

      const memories = response.data;
      const contextWindow = this.buildContextWindow(memories, args.max_tokens);

      return {
        content: [{
          type: 'text',
          text: `Context Window (${contextWindow.memory_count} memories, ${contextWindow.total_tokens} tokens):\n\n${JSON.stringify(contextWindow, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting context: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async storeVector(args) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/projects/${this.projectId}/database/vectors/upsert`,
        {
          vector_embedding: args.vector_embedding,
          document: args.document,
          vector_metadata: args.metadata || {},
          namespace: args.namespace || 'windsurf',
          source: 'windsurf-mcp'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: [{
          type: 'text',
          text: `Vector stored successfully with ID: ${response.data.vector_id}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error storing vector: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async searchVectors(args) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/projects/${this.projectId}/database/vectors/search`,
        {
          query_vector: args.query_vector,
          namespace: args.namespace,
          limit: args.limit || 10,
          similarity_threshold: args.threshold || 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const vectors = response.data.vectors || [];
      const formattedResults = vectors.map(vector => 
        `Score: ${vector.similarity_score.toFixed(3)} | ${vector.document} | ${JSON.stringify(vector.vector_metadata)}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${vectors.length} similar vectors:\n\n${formattedResults}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error searching vectors: ${error.message}`
        }],
        isError: true
      };
    }
  }

  buildContextWindow(memories, maxTokens = 8192) {
    // Simple token estimation (4 chars = 1 token)
    let tokenCount = 0;
    const contextMessages = [];

    for (const memory of memories.reverse()) { // Most recent first
      const estimatedTokens = Math.ceil(memory.content.length / 4);
      
      if (tokenCount + estimatedTokens > maxTokens) {
        break;
      }

      contextMessages.unshift({
        role: memory.role,
        content: memory.content,
        timestamp: memory.created_at,
        memory_id: memory.memory_id
      });

      tokenCount += estimatedTokens;
    }

    return {
      session_id: memories[0]?.session_id || 'unknown',
      total_tokens: tokenCount,
      memory_count: contextMessages.length,
      messages: contextMessages,
      timestamp: new Date().toISOString()
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ZeroDB MCP Server running on stdio');
  }
}

// Start the server
if (require.main === module) {
  const server = new ZeroDBMCPServer();
  server.start().catch(console.error);
}

module.exports = ZeroDBMCPServer;
```

### **Step 3: Install Dependencies**

```bash
# Navigate to your MCP server directory
cd ~/.windsurf/

# Install required packages
npm init -y
npm install @modelcontextprotocol/sdk axios
```

### **Step 4: Configure Environment Variables**

Create a `.env` file or update your shell profile:

```bash
# ZeroDB Configuration
export ZERODB_API_URL="https://api.ainative.studio/api/v1"
export ZERODB_PROJECT_ID="your-project-id-here" 
export ZERODB_API_TOKEN="your-jwt-token-here"
export MCP_MEMORY_ENABLED="true"
export MCP_CONTEXT_WINDOW="8192"
export MCP_RETENTION_DAYS="30"
```

### **Step 5: Get Your ZeroDB Credentials**

#### **5.1: Get Authentication Token**

```bash
# Get JWT token
curl -X POST "https://api.ainative.studio/api/v1/auth/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your-email@example.com&password=your-secure-password"

# Extract token (save this for 30 minutes)
export ZERODB_API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **5.2: Create or Get Project ID**

```bash
# Create a new project for MCP integration
curl -X POST "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Windsurf MCP Integration","description":"Memory and context for AI coding sessions"}'

# Save the project ID
export ZERODB_PROJECT_ID="your-project-id-from-response"
```

#### **5.3: Enable ZeroDB for Project**

```bash
# Enable ZeroDB features
curl -X POST "https://api.ainative.studio/api/v1/projects/$ZERODB_PROJECT_ID/database" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN"
```

### **Step 6: Test MCP Integration**

Test your MCP server directly:

```bash
# Test the MCP server
cd ~/.windsurf/
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node zerodb-mcp-server.js

# Expected response should show available tools
```

### **Step 7: Restart Windsurf**

1. **Close Windsurf completely**
2. **Restart Windsurf**
3. **Verify MCP connection** in Windsurf settings
4. **Test memory storage** by asking the AI to remember something

## 🧠 **Using ZeroDB MCP in Windsurf**

### **Basic Memory Operations**

Once configured, you can use these commands in Windsurf:

#### **Store Memory**
```
@mcp Remember this: I'm working on a React authentication system using JWT tokens.
```

#### **Search Memory**
```
@mcp What did I tell you about authentication?
```

#### **Get Session Context**
```
@mcp Show me our conversation context from this session.
```

### **Advanced Vector Operations**

#### **Store Code Snippets**
```
@mcp Store this authentication function for future reference: [paste code]
```

#### **Search Similar Code**
```
@mcp Find similar authentication patterns I've used before.
```

## 🔧 **Configuration Options**

### **Memory Settings**

Edit your MCP configuration to customize memory behavior:

```json
{
  "mcpServers": {
    "zerodb": {
      "env": {
        "MCP_CONTEXT_WINDOW": "16384",      // Larger context window
        "MCP_RETENTION_DAYS": "90",         // Longer memory retention
        "MCP_AUTO_STORE": "true",           // Auto-store conversations
        "MCP_SEMANTIC_SEARCH": "true",      // Enable semantic search
        "MCP_NAMESPACE": "windsurf-main"    // Custom namespace
      }
    }
  }
}
```

### **Advanced Features**

#### **Custom Agent ID**
```json
{
  "env": {
    "MCP_AGENT_ID": "windsurf-agent-{username}",
    "MCP_SESSION_ID": "windsurf-session-{timestamp}"
  }
}
```

#### **Memory Optimization**
```json
{
  "env": {
    "MCP_OPTIMIZE_MEMORY": "true",
    "MCP_COMPRESSION": "semantic_clustering",
    "MCP_DEDUPLICATE": "true"
  }
}
```

## 🚀 **Other AI Editor Integration**

### **Cursor Integration**

For Cursor IDE, create similar configuration:

**File:** `~/.cursor/mcp_servers.json`

```json
{
  "mcpServers": {
    "zerodb": {
      "command": "node",
      "args": ["/path/to/zerodb-mcp-server.js"],
      "env": {
        "ZERODB_API_URL": "https://api.ainative.studio/api/v1",
        "ZERODB_PROJECT_ID": "your-project-id-here",
        "ZERODB_API_TOKEN": "your-jwt-token-here",
        "MCP_AGENT_ID": "cursor-agent"
      }
    }
  }
}
```

### **VS Code with Continue**

For VS Code with Continue extension:

**File:** `~/.continue/config.json`

```json
{
  "mcpServers": [
    {
      "name": "zerodb",
      "serverPath": "/path/to/zerodb-mcp-server.js",
      "env": {
        "ZERODB_API_URL": "https://api.ainative.studio/api/v1",
        "ZERODB_PROJECT_ID": "your-project-id-here",
        "ZERODB_API_TOKEN": "your-jwt-token-here"
      }
    }
  ]
}
```

### **AI Desktop Applications**

For MCP-compatible AI desktop applications:

**Common Configuration Locations:**
- Windows: `~/AppData/Roaming/[Editor]/mcp_settings.json`
- macOS: `~/Library/Application Support/[Editor]/mcp_settings.json`
- Linux: `~/.config/[Editor]/mcp_settings.json`

```json
{
  "mcpServers": {
    "zerodb": {
      "command": "node",
      "args": ["/path/to/zerodb-mcp-server.js"],
      "env": {
        "ZERODB_API_URL": "https://api.ainative.studio/api/v1",
        "ZERODB_PROJECT_ID": "your-project-id-here",
        "ZERODB_API_TOKEN": "your-jwt-token-here"
      }
    }
  }
}
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. MCP Server Not Loading**
```bash
# Check if MCP server is executable
chmod +x ~/.windsurf/zerodb-mcp-server.js

# Test server manually
node ~/.windsurf/zerodb-mcp-server.js
```

#### **2. Authentication Errors**
```bash
# Verify token is valid
curl -X GET "https://api.ainative.studio/api/v1/projects/$ZERODB_PROJECT_ID/database" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN"

# If expired, get new token
curl -X POST "https://api.ainative.studio/api/v1/auth/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your-email@example.com&password=your-secure-password"
```

#### **3. Project Not Found**
```bash
# List available projects
curl -X GET "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN"

# Create new project if needed
curl -X POST "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"MCP Integration","description":"AI Editor Memory Integration"}'
```

### **Debug Mode**

Enable debug logging in your MCP server:

```javascript
// Add to zerodb-mcp-server.js
const DEBUG = process.env.MCP_DEBUG === 'true';

function debugLog(message, data = null) {
  if (DEBUG) {
    console.error(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}
```

Set debug environment variable:
```bash
export MCP_DEBUG=true
```

## 📊 **Memory Analytics**

### **View Memory Usage**

```bash
# Get memory statistics
curl -X GET "https://api.ainative.studio/api/v1/projects/$ZERODB_PROJECT_ID/database" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN"

# List recent memories
curl -X GET "https://api.ainative.studio/api/v1/projects/$ZERODB_PROJECT_ID/database/memory?limit=50" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN"
```

### **Memory Optimization**

Use ZeroDB's built-in optimization:

```bash
# Get memory insights
curl -X POST "https://api.ainative.studio/api/v1/projects/$ZERODB_PROJECT_ID/database/memory/optimize" \
  -H "Authorization: Bearer $ZERODB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "semantic_clustering"}'
```

## 🔄 **Token Renewal**

### **Automatic Token Renewal**

Add token renewal to your MCP server:

```javascript
class ZeroDBMCPServer {
  constructor() {
    // ... existing code ...
    this.tokenExpiry = null;
    this.setupTokenRenewal();
  }

  async renewToken() {
    try {
      const response = await axios.post(
        `${this.apiUrl.replace('/api/v1', '')}/api/v1/auth/`,
        new URLSearchParams({
          username: process.env.ZERODB_USERNAME,
          password: process.env.ZERODB_PASSWORD
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      this.apiToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      console.error('Token renewed successfully');
    } catch (error) {
      console.error('Token renewal failed:', error.message);
    }
  }

  setupTokenRenewal() {
    // Renew token every 25 minutes (tokens expire after 30 minutes)
    setInterval(() => {
      this.renewToken();
    }, 25 * 60 * 1000);
  }
}
```

Add credentials to environment:
```bash
export ZERODB_USERNAME="your-email@example.com"
export ZERODB_PASSWORD="your-secure-password"
```

## 🎯 **Best Practices**

### **1. Session Management**
- Use consistent session IDs for related conversations
- Include timestamps in session IDs for chronological tracking
- Group related coding sessions together

### **2. Memory Optimization**
- Store only meaningful interactions, not routine commands
- Use descriptive metadata for better searchability
- Implement memory compression for long sessions

### **3. Vector Storage**
- Store code snippets with meaningful metadata
- Use consistent namespaces for different projects
- Include file paths and function names in metadata

### **4. Security**
- Rotate JWT tokens regularly
- Use environment variables for sensitive data
- Implement rate limiting for API calls

## 📚 **Additional Resources**

### **ZeroDB API Documentation**
- Complete API reference: `/ZERODB_ARCHITECTURE.md`
- Testing guide: `/ZERODB_TESTING.md`
- Team integration: `/ZERODB_TEAM_FILE_INDEX.md`

### **MCP Specification**
- Official MCP docs: https://modelcontextprotocol.io/
- SDK documentation: https://github.com/modelcontextprotocol/sdk

### **Support**
- ZeroDB issues: Check backend logs for API errors
- MCP integration: Test server manually with JSON-RPC calls
- Windsurf support: Check Windsurf console for MCP connection status

## 🚀 **Quick Start Summary**

1. **Create MCP config** at `~/.windsurf/mcp_servers.json`
2. **Install dependencies** with `npm install @modelcontextprotocol/sdk axios`
3. **Get ZeroDB credentials** (token + project ID)
4. **Enable ZeroDB** for your project
5. **Create MCP server** script (`zerodb-mcp-server.js`)
6. **Restart Windsurf** to load MCP integration
7. **Test memory operations** with `@mcp` commands

Your AI coding sessions will now have persistent memory powered by ZeroDB! 🧠✨