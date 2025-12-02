# ZeroDB Embeddings Generation - Test Documentation

This document describes the testing strategy for the ZeroDB-based embeddings generation script.

## Test Coverage Requirements

The testing requirements mandate **minimum 80% code coverage** with the following test categories:

### 1. Authentication Tests

#### Test: Successful Authentication
- **Purpose**: Verify ZeroDB authentication flow works correctly
- **Input**: Valid credentials (ZERODB_EMAIL, ZERODB_PASSWORD)
- **Expected Output**: Access token returned
- **Validation**: Token is non-empty string

#### Test: Authentication Failure
- **Purpose**: Verify error handling for invalid credentials
- **Input**: Invalid credentials
- **Expected Output**: Error thrown with meaningful message
- **Validation**: Error message contains "authentication failed"

#### Test: Authentication Retry Logic
- **Purpose**: Verify retry mechanism on network errors
- **Input**: Simulated network timeout/error
- **Expected Output**: Retries up to MAX_RETRIES times with exponential backoff
- **Validation**: Logs show retry attempts

### 2. Document Processing Tests

#### Test: MDX File Parsing
- **Purpose**: Verify .mdx files are parsed correctly
- **Input**: Sample .mdx file with headings and content
- **Expected Output**: Sections extracted with headings and slugs
- **Validation**:
  - Correct number of sections
  - Heading text matches source
  - Slugs are properly generated

#### Test: Checksum Generation
- **Purpose**: Verify checksums are consistent and detect changes
- **Input**: Same content processed twice
- **Expected Output**: Identical checksums
- **Validation**: SHA256 base64 checksum format

#### Test: Document Chunking
- **Purpose**: Verify documents are chunked appropriately by headings
- **Input**: MDX with multiple heading levels
- **Expected Output**: Sections split at each heading
- **Validation**: Each section starts with heading (except first)

### 3. ZeroDB Integration Tests

#### Test: Embed-and-Store Single Document
- **Purpose**: Verify single document embedding works
- **Input**: One document with metadata
- **Expected Output**: Success response from ZeroDB
- **Validation**:
  - HTTP 200 response
  - embedded_count = 1

#### Test: Batch Processing (10+ Documents)
- **Purpose**: Verify batch processing works with BATCH_SIZE=10
- **Input**: 15 documents
- **Expected Output**: Two batches (10 + 5)
- **Validation**:
  - First batch has 10 documents
  - Second batch has 5 documents
  - All documents stored successfully

#### Test: Upsert Behavior
- **Purpose**: Verify existing documents are updated
- **Input**: Document with same ID but different content
- **Expected Output**: Document updated, not duplicated
- **Validation**: Only one document with that ID exists

### 4. Checksum-Based Change Detection Tests

#### Test: Unchanged Document Skipped
- **Purpose**: Verify unchanged documents aren't re-processed
- **Input**: Document with existing checksum match
- **Expected Output**: Document skipped
- **Validation**: "Unchanged (checksum match), skipping" logged

#### Test: Changed Document Re-processed
- **Purpose**: Verify changed documents trigger re-processing
- **Input**: Document with different checksum
- **Expected Output**: Old sections deleted, new sections added
- **Validation**: "Document changed, deleting old sections" logged

#### Test: New Document Processed
- **Purpose**: Verify new documents are processed
- **Input**: Document without existing checksum
- **Expected Output**: Document processed
- **Validation**: "New document, processing" logged

### 5. Error Handling & Retry Logic Tests

#### Test: Retry on Network Failure
- **Purpose**: Verify retry logic for transient failures
- **Input**: Simulated 500 server error (recovers on retry)
- **Expected Output**: Successful after retry
- **Validation**:
  - Retry attempts logged
  - Exponential backoff applied (1s, 2s, 4s)

#### Test: Failure After Max Retries
- **Purpose**: Verify script fails gracefully after retries exhausted
- **Input**: Persistent server error
- **Expected Output**: Error thrown after MAX_RETRIES (3)
- **Validation**: "Operation failed after retries" error

#### Test: Invalid API Response Handling
- **Purpose**: Verify graceful handling of malformed responses
- **Input**: Invalid JSON from API
- **Expected Output**: Error logged, script continues
- **Validation**: Error message logged, script doesn't crash

### 6. Metadata Storage Tests

#### Test: Metadata Stored Correctly
- **Purpose**: Verify all metadata fields are stored
- **Input**: Document with path, heading, slug, checksum
- **Expected Output**: All fields present in stored document
- **Validation**:
  - metadata.path = document path
  - metadata.heading = section heading
  - metadata.slug = github-slugger slug
  - metadata.checksum = SHA256 checksum
  - metadata.section_index = section number

#### Test: Null Metadata Handling
- **Purpose**: Verify null/undefined metadata handled correctly
- **Input**: Document without heading or slug
- **Expected Output**: Fields stored as null
- **Validation**: No errors, null values stored

### 7. Integration Tests (Real ZeroDB)

These tests require valid ZeroDB credentials in .env file:

#### Test: Full End-to-End Flow
- **Purpose**: Verify complete workflow with real ZeroDB
- **Prerequisites**:
  - Valid .env with ZeroDB credentials
  - At least one .mdx file in pages/
- **Steps**:
  1. Authenticate with ZeroDB
  2. Process MDX files
  3. Generate embeddings
  4. Store in ZeroDB
  5. Verify retrieval
- **Expected Output**:
  - All pages processed
  - Embeddings stored successfully
  - Search returns results

#### Test: Refresh Flag
- **Purpose**: Verify --refresh flag re-processes all documents
- **Input**: --refresh flag
- **Expected Output**: All documents re-processed regardless of checksum
- **Validation**: No "skipping" messages logged

## Running Tests

### Manual Integration Test

To manually test the embeddings generation:

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with valid ZeroDB credentials

# 2. Run embeddings generation (first time)
pnpm run embeddings

# Expected output:
# - Authentication successful
# - X pages discovered
# - All pages processed (none skipped)
# - Embeddings stored successfully

# 3. Run embeddings generation (second time)
pnpm run embeddings

# Expected output:
# - All pages skipped (checksum match)
# - No new embeddings generated

# 4. Modify a .mdx file
echo "# New Section\nNew content" >> pages/docs/openai_embeddings.mdx

# 5. Run embeddings generation (third time)
pnpm run embeddings

# Expected output:
# - 1 page updated (checksum changed)
# - Old sections deleted
# - New sections added

# 6. Test refresh flag
pnpm run embeddings:refresh

# Expected output:
# - All pages re-processed
# - No checksum checking
```

### Testing Checklist

- [ ] Authentication flow works with valid credentials
- [ ] .mdx files parsed correctly (headings, content, metadata)
- [ ] Documents chunked appropriately by heading
- [ ] Checksums generated consistently
- [ ] Single document embedding works
- [ ] Batch processing works (10+ documents)
- [ ] Upsert updates existing documents
- [ ] Unchanged documents skipped (checksum match)
- [ ] Changed documents re-processed
- [ ] Retry logic works on transient failures
- [ ] Error handling graceful (doesn't crash)
- [ ] All metadata fields stored correctly
- [ ] --refresh flag re-processes all documents

## Code Coverage Target

**Target**: 80% minimum code coverage

**Key Functions to Cover**:
1. `authenticateZeroDB()` - Authentication logic
2. `fetchExistingChecksums()` - Checksum retrieval
3. `deleteOldSections()` - Section deletion
4. `embedAndStoreDocuments()` - Core embedding function
5. `withRetry()` - Retry logic
6. `processMdxForSearch()` - MDX processing
7. `generateEmbeddings()` - Main orchestration function

**Coverage Areas**:
- Happy path (successful execution)
- Error paths (network failures, invalid data)
- Edge cases (empty documents, null metadata)
- Retry logic (exponential backoff)
- Batch processing (partial batches, full batches)

## Test Environment Setup

### Prerequisites

1. **ZeroDB Account**: Create account at https://ainative.studio
2. **ZeroDB Project**: Create project and enable vector database
3. **Environment Variables**: Set in .env file:
   ```
   ZERODB_API_URL=https://api.ainative.studio
   ZERODB_PROJECT_ID=your-project-id
   ZERODB_EMAIL=your-email
   ZERODB_PASSWORD=your-password
   ```

### Sample Test Data

Create test .mdx files in `pages/test/`:

**pages/test/sample1.mdx**:
```mdx
# Sample Document 1

This is the first section.

## Subsection 1.1

Content for subsection 1.1.

## Subsection 1.2

Content for subsection 1.2.
```

**pages/test/sample2.mdx**:
```mdx
# Sample Document 2

This is a different document.
```

## Success Criteria

The migration is considered successful when:

1. ✅ Script runs without errors
2. ✅ All .mdx files processed correctly
3. ✅ Embeddings stored in ZeroDB (not OpenAI/Supabase)
4. ✅ Checksums prevent re-embedding unchanged docs
5. ✅ Batch processing works (10 docs per request)
6. ✅ Retry logic handles transient failures
7. ✅ Metadata (path, heading, checksum) stored correctly
8. ✅ --refresh flag forces re-processing
9. ✅ All tests pass
10. ✅ Minimum 80% code coverage achieved

## Notes

- **No OpenAI SDK**: All OpenAI dependencies removed ✅
- **No Supabase Client**: All Supabase dependencies removed ✅
- **Using node-fetch**: Already installed, using for HTTP calls ✅
- **FREE Embeddings**: ZeroDB auto-embedding is FREE (384D model) ✅
- **Correct Env Vars**: Using ZERODB_* variables from .env.example ✅
