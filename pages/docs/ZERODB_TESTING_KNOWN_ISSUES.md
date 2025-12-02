# ZeroDB Testing Guide - Known Issues & Solutions

## 🚨 **Known Issue: Database Initialization Race Condition**

### **Problem Description:**
When testing ZeroDB endpoints, newly created projects may return 404 "Project not found" errors for the first few seconds after creation.

### **Root Cause:**
The project creation flow has a timing issue:

1. `POST /projects/` creates project in main `projects` table ✅
2. ZeroDB initialization happens asynchronously in background ⏳
3. `GET /projects/{id}` and ZeroDB operations query `zerodb_projects` table ❌
4. **Gap period where project exists but ZeroDB record doesn't**

### **Symptoms:**
```bash
# This works immediately after creation
GET /projects/ → 200 ✅

# This fails immediately after creation  
GET /projects/{new_project_id} → 404 "Project not found" ❌

# This works after ~2-5 seconds
GET /projects/{new_project_id} → 200 ✅
```

### **Solutions:**

#### **Option 1: Use Existing Projects (Recommended for Testing)**
```bash
# Get existing project ID
PROJECT_ID=$(curl -s -X GET "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Use existing project for all tests
curl -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID"
```

#### **Option 2: Add Delay After Project Creation**
```bash
# Create project
RESPONSE=$(curl -s -X POST "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "description": "Test"}')

PROJECT_ID=$(echo "$RESPONSE" | jq -r '.id')

# Wait for ZeroDB initialization
echo "Waiting for ZeroDB initialization..."
sleep 3

# Now safe to use
curl -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID"
```

#### **Option 3: Retry Logic**
```bash
# Function to wait for project availability
wait_for_project() {
    local project_id=$1
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -X GET "https://api.ainative.studio/api/v1/projects/$project_id" \
           -H "Authorization: Bearer $TOKEN" | grep -q '"id"'; then
            echo "Project $project_id is ready!"
            return 0
        fi
        echo "Attempt $attempt: Project not ready, waiting..."
        sleep 1
        ((attempt++))
    done
    
    echo "Project failed to initialize after $max_attempts attempts"
    return 1
}
```

### **Technical Details:**

**Tables Involved:**
- `projects` - Main project table (created immediately)
- `zerodb_projects` - ZeroDB-specific project metadata (created asynchronously)

**Affected Endpoints:**
- ✅ `GET /projects/` - Uses main projects table
- ✅ `POST /projects/` - Creates in main projects table
- ❌ `GET /projects/{id}` - Queries zerodb_projects table
- ❌ All `/projects/{id}/database/*` endpoints - Require zerodb_projects record

### **Recommended Testing Flow:**

```bash
#!/bin/bash
# ZeroDB Testing Script with Race Condition Handling

export TOKEN="your-jwt-token"

echo "1. Getting existing projects..."
PROJECTS_RESPONSE=$(curl -s -X GET "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROJECTS_RESPONSE" | jq -e '.[0]' > /dev/null 2>&1; then
    # Use existing project
    PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | jq -r '.[0].id')
    echo "Using existing project: $PROJECT_ID"
else
    # Create new project and wait
    echo "2. Creating new project..."
    CREATE_RESPONSE=$(curl -s -X POST "https://api.ainative.studio/api/v1/projects/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name": "Test Project", "description": "Testing ZeroDB"}')
    
    PROJECT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
    echo "Created project: $PROJECT_ID"
    
    echo "3. Waiting for ZeroDB initialization..."
    sleep 5  # Wait for async initialization
fi

echo "4. Testing endpoints with project: $PROJECT_ID"

# Now safe to test all endpoints
curl -s -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### **Future Fix Required:**

The proper solution is to modify the project creation endpoint to:
1. Create project in main `projects` table
2. **Immediately** create corresponding `zerodb_projects` record
3. Return only after both records are created

**Code Location:** `/app/zerodb/api/production_router.py:24-51`

### **Workaround Status:**
- ✅ **Identified** - Race condition between project creation and ZeroDB initialization
- ✅ **Documented** - Testing workarounds provided
- ⏳ **Pending Fix** - Synchronous ZeroDB record creation needed

---

## 🚨 **Known Issue: JWT Token Authentication**

### **Problem Description:**
JWT token authentication failures are common when testing, often due to incorrect secret keys or token format issues.

### **Root Cause:**
Multiple factors can cause authentication failures:
1. Using wrong SECRET_KEY for JWT generation
2. Token expiration
3. Incorrect token format or missing required fields

### **Symptoms:**
```bash
# Common authentication errors
{"detail": "Could not validate credentials"}  # Wrong secret key
{"detail": "Not authenticated"}  # Expired or malformed token
```

### **Solutions:**

#### **Correct JWT Token Generation**
```python
import jwt
import time

# IMPORTANT: Use the correct secret key from app/core/config.py
SECRET_KEY = 'your-secret-key-here'  # NOT 'cody-secret-key-2024' or other values

payload = {
    'sub': 'a9b717be-f449-43c6-abb4-18a1a6a0c70e',  # Valid user ID from database
    'role': 'admin',  # Required field
    'email': 'test@email.com',  # Required field
    'iat': int(time.time()),
    'exp': int(time.time() + 86400)  # 24 hours
}

token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
print(f'TOKEN={token}')
```

#### **Verify Token Before Testing**
```python
# Decode and verify token is valid
try:
    decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    print(f"Token valid until: {decoded['exp']}")
    print(f"Current time: {int(time.time())}")
    print(f"Token is valid: {decoded['exp'] > int(time.time())}")
except jwt.InvalidTokenError as e:
    print(f"Invalid token: {e}")
```

---

## 🚨 **Known Issue: Bash Variable Persistence**

### **Problem Description:**
Environment variables (TOKEN, PROJECT_ID) get lost between bash commands when testing endpoints.

### **Root Cause:**
Each bash command runs in a separate subshell, so exported variables don't persist.

### **Symptoms:**
```bash
export TOKEN="eyJ..."
echo $TOKEN  # Shows token

# Next command
curl -H "Authorization: Bearer $TOKEN"  # TOKEN is empty!
```

### **Solutions:**

#### **Option 1: Use Command Chaining**
```bash
# Chain commands with && to preserve variables
TOKEN="eyJ..." && \
PROJECT_ID="uuid-here" && \
curl -s -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

#### **Option 2: Create Test Script**
```bash
#!/bin/bash
# save as test_zerodb.sh

# Set all variables at script level
export TOKEN="eyJ..."
export PROJECT_ID="uuid-here"
export BASE_URL="https://api.ainative.studio/api/v1"

# Now all commands in script can use these variables
curl -s -X GET "$BASE_URL/projects/" -H "Authorization: Bearer $TOKEN"
```

#### **Option 3: Use Environment File**
```bash
# Create .env.test file
echo 'TOKEN="eyJ..."' > .env.test
echo 'PROJECT_ID="uuid-here"' >> .env.test

# Source before each test session
source .env.test
```

---

## 🚨 **Known Issue: API Endpoint URL Confusion**

### **Problem Description:**
The correct API endpoint URL pattern may be unclear, leading to 404 errors.

### **Correct Production URL Pattern:**
```bash
# ✅ CORRECT - Production API base URL
BASE_URL="https://api.ainative.studio/api/v1"

# ❌ INCORRECT - Common mistakes
# https://api.ainative.studio/projects/  (missing /api/v1)
# https://ainative.studio/api/v1/projects/  (wrong domain)
# http://localhost:8000/api/v1/projects/  (local instead of prod)
```

### **Complete URL Examples:**
```bash
# Projects endpoints
GET  https://api.ainative.studio/api/v1/projects/
POST https://api.ainative.studio/api/v1/projects/
GET  https://api.ainative.studio/api/v1/projects/{project_id}

# Database endpoints
GET  https://api.ainative.studio/api/v1/projects/{project_id}/database/status
POST https://api.ainative.studio/api/v1/projects/{project_id}/database/tables
```

---

## 📋 **Quick Testing Checklist**

Before testing ZeroDB endpoints:

1. **Generate Fresh JWT Token**
   ```python
   # Use correct SECRET_KEY = 'your-secret-key-here'
   # Include all required fields: sub, role, email, iat, exp
   ```

2. **Verify Token Works**
   ```bash
   curl -s -X GET "https://api.ainative.studio/api/v1/projects/" \
     -H "Authorization: Bearer $TOKEN"
   # Should return project list, not authentication error
   ```

3. **Use Existing Project or Wait After Creation**
   ```bash
   # Option 1: Use existing project
   PROJECT_ID=$(curl -s -X GET "https://api.ainative.studio/api/v1/projects/" \
     -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
   
   # Option 2: Create and wait
   # ... create project ...
   sleep 3  # Wait for ZeroDB initialization
   ```

4. **Chain Commands or Use Script**
   ```bash
   # Prevent variable loss
   TOKEN="..." && PROJECT_ID="..." && curl ...
   ```

---

*These issues affect testing experience but not production functionality. Following these guidelines will ensure smooth endpoint testing.*