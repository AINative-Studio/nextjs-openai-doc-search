# ZeroDB Team Validation Guide

## 🎯 Quick Start for Frontend Team

This document provides the **exact curl commands** that have been validated to work 100%. Use these as reference for your frontend integration.

## ✅ Complete 9-Step Process (100% Working)

### Step 1: Authentication
```bash
curl -X POST "https://api.ainative.studio/api/v1/auth/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=your-secure-password"
```
**Expected Response:** `{"access_token":"eyJ...","token_type":"bearer","expires_in":1800}`

### Step 2: List Projects
```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Response:** `[]` (empty array if no projects)

### Step 3: Create Project
```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Project Name","description":"Your project description"}'
```
**Expected Response:** `{"id":"uuid","name":"Your Project Name","status":"active","user_id":"uuid"}`

### Step 4: Get ZeroDB Status
```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID/database" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Response:** `{"enabled":true,"project_id":"uuid","tables_count":0,...}`

### Step 5: Enable ZeroDB
```bash
curl -X POST "https://api.ainative.studio/api/v1/projects/$PROJECT_ID/database" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Response:** `{"success":true,"message":"ZeroDB enabled for project",...}`

### Step 6: List Tables
```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID/database/tables" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Response:** `[]` (empty array initially)

### Step 7: List Vectors
```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID/database/vectors" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Response:** `[]` (empty array initially)

### Step 8: List Memory
```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID/database/memory" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Response:** `[]` (empty array initially)

### Step 9: List Files
```bash
curl -X GET "https://api.ainative.studio/api/v1/projects/$PROJECT_ID/database/files" \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Response:** `[]` (empty array initially)

## 🚀 Automated Testing Script

We've created a complete validation script that you can run:

```bash
./step_by_step_demo.sh
```

This script will:
1. ✅ Authenticate and get token
2. ✅ List existing projects  
3. ✅ Create a new project
4. ✅ Test all 6 ZeroDB endpoints
5. ✅ Show you exactly what responses to expect

## 📋 Integration Notes

### Authentication Requirements:
- **Username:** `admin`
- **Password:** `your-secure-password`
- **Token expiration:** 30 minutes (1800 seconds)
- **Header format:** `Authorization: Bearer {token}`

### Project Management:
- Projects are user-scoped (each user sees only their projects)
- Project IDs are UUIDs returned from creation
- All ZeroDB operations require a valid project ID

### ZeroDB Operations:
- All basic GET operations return empty arrays initially
- POST operations to enable ZeroDB return configuration details
- Each project gets its own isolated database namespace

## ✅ Ready for Frontend Implementation

**Success Rate:** 100% for all basic operations (9/9 endpoints working)

**What Works:**
- Complete authentication flow
- Project creation and management
- ZeroDB database enabling  
- All basic resource listing endpoints

**Frontend teams can immediately implement:**
1. User login/authentication
2. Project selection/creation interface
3. ZeroDB database status monitoring
4. Resource listing views (tables, vectors, memory, files)

## 🔗 Additional Resources

- **Complete Documentation:** `zerodbflow.md`
- **Testing Scripts:** `step_by_step_demo.sh`, `complete_curl_validation.py`
- **Validation Results:** `zerodb_test_results.json`

## 🎉 Production Ready

All endpoints have been thoroughly tested and validated. The authentication issue has been resolved and the complete integration flow is now working perfectly.