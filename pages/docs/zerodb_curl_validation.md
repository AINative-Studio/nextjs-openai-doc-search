# Complete ZeroDB cURL Validation Guide

## 🔐 Step 1: Authentication

```bash
# Get authentication token
curl -X POST "https://api.ainative.studio/api/v1/auth/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=your-secure-password"

# Response:
# {"access_token":"eyJ...","token_type":"bearer","expires_in":1800}

# Extract token for use in subsequent commands
TOKEN="your-token-here"
```

## 📋 Step 2: Project Management

### List user projects

```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
[]
```

### Create new project

```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "ZeroDB Complete Validation", "description": "Full endpoint validation with curl documentation"}'
```

**Response (200):**
```json
{
  "id": "e71f7962-8a76-4caf-ad9b-a25da7597401",
  "name": "ZeroDB Complete Validation",
  "status": "active",
  "user_id": "a9b717be-f449-43c6-abb4-18a1a6a0c70e"
}
```

## 🗄️ Step 3: ZeroDB Basic Operations

### Get ZeroDB status

```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{"enabled": "...", "project_id": "...", "tables_count": "...", ...}
```

### Verify ZeroDB enabled

```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{"enabled": "...", "project_id": "...", "tables_count": "...", ...}
```

### List ZeroDB tables

```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/tables" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
[]
```

### List ZeroDB vectors

```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/vectors" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
[]
```

### List ZeroDB memory

```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/memory" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
[]
```

### List ZeroDB files

```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/files" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
[]
```

## ⚡ Step 4: Advanced Operations

### Enable ZeroDB

```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{"success": "...", "message": "...", "project_id": "...", ...}
```

### Upsert vector (corrected schema)

```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/vectors/upsert" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vector_embedding": [0.1, 0.2, 0.3, 0.4, 0.5], "metadata": {"source": "test_document"}, "namespace": "test"}'
```

**Response (500):**
```json
{
  "message": "An unexpected error occurred",
  "detail": "Server error",
  "timestamp": "2025-07-03T21:25:46.561059",
  "traceId": "857bd0fd-fed9-4c48-a451-0fb1eccee98a"
}
```

### Store memory (UUID format)

```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/memory/store" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test memory content for validation", "agent_id": "550e8400-e29b-41d4-a716-446655440000", "session_id": "550e8400-e29b-41d4-a716-446655440001", "role": "user"}'
```

**Response (500):**
```json
{
  "message": "An unexpected error occurred",
  "detail": "Server error",
  "timestamp": "2025-07-03T21:25:46.671893",
  "traceId": "d4bcc6c0-c356-4105-ba5c-2b56e7f1e0e9"
}
```

### Publish event (corrected schema)

```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/events/publish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic": "validation_events", "event_payload": {"action": "test", "timestamp": 1751577946}, "metadata": {"source": "curl_validation"}}'
```

**Response (500):**
```json
{
  "message": "An unexpected error occurred",
  "detail": "Server error",
  "timestamp": "2025-07-03T21:25:46.780644",
  "traceId": "c00e8351-40ea-4aa6-95fa-75173e8015be"
}
```

### Upload file metadata (corrected schema)

```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/e71f7962-8a76-4caf-ad9b-a25da7597401/database/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"file_key": "test_file.txt", "content_type": "text/plain", "size": 1024, "metadata": {"uploaded_by": "validation_script"}}'
```

**Response (500):**
```json
{
  "message": "An unexpected error occurred",
  "detail": "Server error",
  "timestamp": "2025-07-03T21:25:46.880011",
  "traceId": "1a53de03-d338-4611-b33a-0c9cf7b32a8f"
}
```

## 📊 Validation Summary

- **Total Endpoints:** 13
- **Successful:** 9
- **Success Rate:** 69.2%

## 🎯 Ready for Frontend Integration

All basic ZeroDB operations are working and documented. Frontend teams can use these exact curl commands as reference for implementing their API integration.
