# Quick Start: ZeroDB Embeddings Migration (Issue #4)

## ✅ Migration Complete!

The embeddings generation script has been successfully migrated from OpenAI + Supabase to ZeroDB.

## What Changed?

### Files Modified
1. **`lib/generate-embeddings.ts`** - Complete rewrite using ZeroDB
   - ❌ Removed: OpenAI SDK, Supabase client
   - ✅ Added: ZeroDB authentication, batch processing, retry logic

### Files Created
2. **`lib/test-embeddings.ts`** - Integration test suite (13 tests)
3. **`lib/generate-embeddings.test.md`** - Test documentation
4. **`MIGRATION_ISSUE_4.md`** - Comprehensive migration guide
5. **`QUICK_START_ISSUE_4.md`** - This file

## Setup (5 Minutes)

### Step 1: Environment Variables

Update your `.env` file with ZeroDB credentials:

```env
ZERODB_API_URL=https://api.ainative.studio
ZERODB_PROJECT_ID=your-zerodb-project-id-here
ZERODB_EMAIL=your-zerodb-email-here
ZERODB_PASSWORD=your-zerodb-password-here
```

**Get your credentials:**
1. Go to https://ainative.studio/dashboard
2. Create a new project (or use existing)
3. Enable vector database
4. Use your AINative account email and password
5. Copy your Project ID

### Step 2: Remove Old Dependencies (Optional)

You can now remove OpenAI and Supabase from package.json if not used elsewhere:

```bash
# These are no longer needed for embeddings
pnpm remove openai @supabase/supabase-js
```

### Step 3: Test the Migration

Run the integration test suite:

```bash
pnpm tsx lib/test-embeddings.ts
```

**Expected output:**
```
✅ Tests Passed: 13
❌ Tests Failed: 0
📈 Pass Rate: 100%
```

## Usage

### Generate Embeddings (First Time)

```bash
pnpm run embeddings
```

This will:
1. Authenticate with ZeroDB
2. Find all .mdx files in `pages/`
3. Process and chunk documents by heading
4. Generate embeddings (FREE via ZeroDB)
5. Store in ZeroDB namespace `documentation`

### Generate Embeddings (Subsequent Runs)

```bash
pnpm run embeddings
```

This will:
1. Authenticate with ZeroDB
2. Fetch existing document checksums
3. **Skip unchanged documents** (saves time!)
4. Only process new or modified documents

### Force Refresh All Documents

```bash
pnpm run embeddings:refresh
```

This will:
1. Ignore all checksums
2. Delete old embeddings
3. Re-generate all embeddings

## What You Get

### Cost Savings
- **Before**: Paid OpenAI API ($0.0001/1K tokens)
- **After**: **FREE** ZeroDB auto-embedding
- **Savings**: 100% of embedding costs

### Better Performance
- **Batch Processing**: 10 documents per API call (vs 1)
- **Retry Logic**: Automatic retry on failures (3 attempts)
- **Change Detection**: Skip unchanged docs (checksum-based)

### Free Embeddings
- **Model**: BAAI/bge-small-en-v1.5
- **Dimensions**: 384D (vs 1536D)
- **Quality**: Excellent for semantic search
- **Cost**: $0 (completely free!)

## Verification

### Check It's Working

```bash
pnpm run embeddings
```

**Look for:**
```
✅ Authenticating with ZeroDB...
✅ Successfully authenticated with ZeroDB
✅ Discovered X pages
✅ Embedding and storing batch of Y documents...
✅ Embedding Generation Complete
```

### Run Tests

```bash
pnpm tsx lib/test-embeddings.ts
```

**Look for:**
```
✅ Authentication
✅ Single Document Embedding
✅ Batch Processing
✅ Upsert Behavior
✅ Checksum Consistency
✅ Retry Logic
✅ Error Handling
```

## Troubleshooting

### Issue: "Environment variables required"

**Solution:** Check your `.env` file has all ZeroDB credentials:
```env
ZERODB_API_URL=https://api.ainative.studio
ZERODB_PROJECT_ID=your-project-id
ZERODB_EMAIL=your-email
ZERODB_PASSWORD=your-password
```

### Issue: "Authentication failed"

**Solutions:**
1. Verify email/password are correct
2. Check you have a ZeroDB account at https://ainative.studio
3. Ensure project ID matches your dashboard

### Issue: "No pages discovered"

**Solutions:**
1. Ensure .mdx files exist in `pages/` directory
2. Check file extensions are `.mdx` or `.md`
3. Verify files aren't in ignored list (404.mdx is ignored)

## Next Steps

### For Search Integration (Issue #5)

The search endpoint will need to be updated to query ZeroDB instead of Supabase.

**Key changes needed:**
1. Update `pages/api/vector-search.ts` to use ZeroDB search API
2. Use same namespace: `documentation`
3. Use same authentication flow
4. Parse results from ZeroDB format

### For Production Deployment

1. ✅ Set production ZeroDB credentials in deployment environment
2. ✅ Run `pnpm run embeddings` during build process
3. ✅ Verify embeddings are accessible
4. ✅ Test search functionality

## Resources

- **Migration Guide**: `MIGRATION_ISSUE_4.md`
- **Test Documentation**: `lib/generate-embeddings.test.md`
- **Integration Tests**: `lib/test-embeddings.ts`
- **Main Script**: `lib/generate-embeddings.ts`

## Summary

✅ **OpenAI SDK removed**
✅ **Supabase client removed**
✅ **ZeroDB auto-embedding working**
✅ **Batch processing implemented**
✅ **Retry logic working**
✅ **Checksums prevent re-embedding**
✅ **All tests passing**

**Issue #4 is COMPLETE!** 🎉

---

**Questions?** Check `MIGRATION_ISSUE_4.md` for detailed documentation.

**Need help?** Run the test suite: `pnpm tsx lib/test-embeddings.ts`
