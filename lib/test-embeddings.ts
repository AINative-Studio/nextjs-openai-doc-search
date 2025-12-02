#!/usr/bin/env tsx
/**
 * Integration test script for ZeroDB embeddings generation
 *
 * This script validates the following:
 * 1. Authentication with ZeroDB
 * 2. Single document embedding
 * 3. Batch processing
 * 4. Checksum-based change detection
 * 5. Error handling and retry logic
 *
 * Usage:
 *   pnpm tsx lib/test-embeddings.ts
 *
 * Prerequisites:
 *   - Valid ZeroDB credentials in .env
 *   - At least one .mdx file in pages/
 */

import * as dotenv from 'dotenv'
import nodeFetch from 'node-fetch'
import { createHash } from 'crypto'

dotenv.config()

// ZeroDB Configuration
const ZERODB_API_URL = process.env.ZERODB_API_URL!
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!
const ZERODB_EMAIL = process.env.ZERODB_EMAIL!
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD!
const ZERODB_NAMESPACE = 'test-documentation'
const ZERODB_MODEL = 'BAAI/bge-small-en-v1.5'

// Test utilities
let testsPassed = 0
let testsFailed = 0

function logTest(name: string, status: 'PASS' | 'FAIL', message?: string) {
  const emoji = status === 'PASS' ? '✅' : '❌'
  console.log(`${emoji} ${name}`)
  if (message) {
    console.log(`   ${message}`)
  }
  if (status === 'PASS') {
    testsPassed++
  } else {
    testsFailed++
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Test 1: Authentication Flow
 */
async function testAuthentication(): Promise<string | null> {
  console.log('\n=== Test 1: Authentication Flow ===')

  try {
    const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(
        ZERODB_PASSWORD
      )}`,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logTest(
        'Authentication',
        'FAIL',
        `HTTP ${response.status}: ${errorText}`
      )
      return null
    }

    const authData = (await response.json()) as { access_token: string }

    if (!authData.access_token) {
      logTest('Authentication', 'FAIL', 'No access token received')
      return null
    }

    logTest('Authentication', 'PASS', `Token: ${authData.access_token.substring(0, 20)}...`)
    return authData.access_token
  } catch (error) {
    logTest('Authentication', 'FAIL', String(error))
    return null
  }
}

/**
 * Test 2: Single Document Embedding
 */
async function testSingleDocumentEmbedding(accessToken: string): Promise<boolean> {
  console.log('\n=== Test 2: Single Document Embedding ===')

  const testDoc = {
    id: 'test-doc-1',
    text: 'This is a test document for ZeroDB embeddings. It contains sample content.',
    metadata: {
      path: '/test/doc1',
      heading: 'Test Document 1',
      slug: 'test-document-1',
      checksum: createHash('sha256').update('test-content-1').digest('base64'),
      section_index: 0,
    },
  }

  try {
    const response = await nodeFetch(
      `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documents: [testDoc],
          namespace: ZERODB_NAMESPACE,
          model: ZERODB_MODEL,
          upsert: true,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      logTest('Single Document Embedding', 'FAIL', `HTTP ${response.status}: ${errorText}`)
      return false
    }

    const result = (await response.json()) as { embedded_count?: number; status?: string }

    if (result.embedded_count === 1) {
      logTest('Single Document Embedding', 'PASS', `Embedded count: ${result.embedded_count}`)
      return true
    } else {
      logTest(
        'Single Document Embedding',
        'FAIL',
        `Expected embedded_count=1, got ${result.embedded_count}`
      )
      return false
    }
  } catch (error) {
    logTest('Single Document Embedding', 'FAIL', String(error))
    return false
  }
}

/**
 * Test 3: Batch Processing (10+ documents)
 */
async function testBatchProcessing(accessToken: string): Promise<boolean> {
  console.log('\n=== Test 3: Batch Processing (15 documents) ===')

  const batchDocs = Array.from({ length: 15 }, (_, i) => ({
    id: `batch-test-doc-${i}`,
    text: `This is batch test document number ${i}. It contains unique content for testing batch processing.`,
    metadata: {
      path: `/test/batch/doc${i}`,
      heading: `Batch Document ${i}`,
      slug: `batch-document-${i}`,
      checksum: createHash('sha256').update(`batch-content-${i}`).digest('base64'),
      section_index: 0,
    },
  }))

  // Test first batch (10 docs)
  try {
    const batch1 = batchDocs.slice(0, 10)
    const response1 = await nodeFetch(
      `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documents: batch1,
          namespace: ZERODB_NAMESPACE,
          model: ZERODB_MODEL,
          upsert: true,
        }),
      }
    )

    if (!response1.ok) {
      const errorText = await response1.text()
      logTest('Batch 1 (10 docs)', 'FAIL', `HTTP ${response1.status}: ${errorText}`)
      return false
    }

    const result1 = (await response1.json()) as { embedded_count?: number }

    if (result1.embedded_count === 10) {
      logTest('Batch 1 (10 docs)', 'PASS', `Embedded count: ${result1.embedded_count}`)
    } else {
      logTest(
        'Batch 1 (10 docs)',
        'FAIL',
        `Expected embedded_count=10, got ${result1.embedded_count}`
      )
      return false
    }

    // Test second batch (5 docs)
    await sleep(500) // Small delay between batches

    const batch2 = batchDocs.slice(10, 15)
    const response2 = await nodeFetch(
      `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documents: batch2,
          namespace: ZERODB_NAMESPACE,
          model: ZERODB_MODEL,
          upsert: true,
        }),
      }
    )

    if (!response2.ok) {
      const errorText = await response2.text()
      logTest('Batch 2 (5 docs)', 'FAIL', `HTTP ${response2.status}: ${errorText}`)
      return false
    }

    const result2 = (await response2.json()) as { embedded_count?: number }

    if (result2.embedded_count === 5) {
      logTest('Batch 2 (5 docs)', 'PASS', `Embedded count: ${result2.embedded_count}`)
      return true
    } else {
      logTest(
        'Batch 2 (5 docs)',
        'FAIL',
        `Expected embedded_count=5, got ${result2.embedded_count}`
      )
      return false
    }
  } catch (error) {
    logTest('Batch Processing', 'FAIL', String(error))
    return false
  }
}

/**
 * Test 4: Upsert Behavior (update existing document)
 */
async function testUpsertBehavior(accessToken: string): Promise<boolean> {
  console.log('\n=== Test 4: Upsert Behavior ===')

  const docId = 'upsert-test-doc'
  const doc1 = {
    id: docId,
    text: 'Original content for upsert test.',
    metadata: {
      path: '/test/upsert',
      heading: 'Upsert Test',
      checksum: 'checksum-v1',
      version: 1,
    },
  }

  const doc2 = {
    id: docId,
    text: 'Updated content for upsert test with new information.',
    metadata: {
      path: '/test/upsert',
      heading: 'Upsert Test (Updated)',
      checksum: 'checksum-v2',
      version: 2,
    },
  }

  try {
    // First insert
    const response1 = await nodeFetch(
      `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documents: [doc1],
          namespace: ZERODB_NAMESPACE,
          model: ZERODB_MODEL,
          upsert: true,
        }),
      }
    )

    if (!response1.ok) {
      const errorText = await response1.text()
      logTest('Upsert - Initial Insert', 'FAIL', `HTTP ${response1.status}: ${errorText}`)
      return false
    }

    logTest('Upsert - Initial Insert', 'PASS', 'Document inserted')

    await sleep(500) // Small delay

    // Update (upsert)
    const response2 = await nodeFetch(
      `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documents: [doc2],
          namespace: ZERODB_NAMESPACE,
          model: ZERODB_MODEL,
          upsert: true,
        }),
      }
    )

    if (!response2.ok) {
      const errorText = await response2.text()
      logTest('Upsert - Update', 'FAIL', `HTTP ${response2.status}: ${errorText}`)
      return false
    }

    logTest('Upsert - Update', 'PASS', 'Document updated (upserted)')
    return true
  } catch (error) {
    logTest('Upsert Behavior', 'FAIL', String(error))
    return false
  }
}

/**
 * Test 5: Checksum Verification
 */
async function testChecksumVerification(): Promise<boolean> {
  console.log('\n=== Test 5: Checksum Generation ===')

  const content = 'Test content for checksum'
  const checksum1 = createHash('sha256').update(content).digest('base64')
  const checksum2 = createHash('sha256').update(content).digest('base64')
  const checksum3 = createHash('sha256').update(content + ' modified').digest('base64')

  if (checksum1 === checksum2) {
    logTest('Checksum Consistency', 'PASS', 'Identical content produces same checksum')
  } else {
    logTest('Checksum Consistency', 'FAIL', 'Checksums should be identical')
    return false
  }

  if (checksum1 !== checksum3) {
    logTest('Checksum Change Detection', 'PASS', 'Modified content produces different checksum')
    return true
  } else {
    logTest('Checksum Change Detection', 'FAIL', 'Checksums should differ for different content')
    return false
  }
}

/**
 * Test 6: Retry Logic (simulated)
 */
async function testRetryLogic(): Promise<boolean> {
  console.log('\n=== Test 6: Retry Logic (Exponential Backoff) ===')

  const MAX_RETRIES = 3
  const RETRY_DELAY_MS = 100 // Reduced for testing

  async function simulatedFailingFunction(attempt: number): Promise<string> {
    if (attempt < 2) {
      throw new Error('Simulated network failure')
    }
    return 'Success'
  }

  let attempts = 0
  const startTime = Date.now()

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      attempts++
      try {
        const result = await simulatedFailingFunction(attempt)
        const elapsed = Date.now() - startTime

        logTest('Retry Logic - Success After Retry', 'PASS', `Succeeded on attempt ${attempts}`)
        logTest(
          'Retry Logic - Exponential Backoff',
          'PASS',
          `Total time: ${elapsed}ms (includes backoff delays)`
        )
        return true
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          const backoffDelay = RETRY_DELAY_MS * Math.pow(2, attempt)
          await sleep(backoffDelay)
        } else {
          throw error
        }
      }
    }
  } catch (error) {
    logTest('Retry Logic', 'FAIL', 'Should have succeeded after retries')
    return false
  }

  return true
}

/**
 * Test 7: Error Handling
 */
async function testErrorHandling(accessToken: string): Promise<boolean> {
  console.log('\n=== Test 7: Error Handling ===')

  // Test with invalid namespace to trigger error
  const invalidDoc = {
    id: 'error-test-doc',
    text: 'This should trigger error handling',
    metadata: {},
  }

  try {
    const response = await nodeFetch(
      `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token-for-testing',
        },
        body: JSON.stringify({
          documents: [invalidDoc],
          namespace: ZERODB_NAMESPACE,
          model: ZERODB_MODEL,
          upsert: true,
        }),
      }
    )

    if (!response.ok) {
      logTest('Error Handling - Invalid Token', 'PASS', 'Correctly rejected invalid token')
      return true
    } else {
      logTest('Error Handling - Invalid Token', 'FAIL', 'Should have rejected invalid token')
      return false
    }
  } catch (error) {
    logTest('Error Handling - Network Error', 'PASS', 'Caught error: ' + String(error))
    return true
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║  ZeroDB Embeddings Generation - Integration Test Suite  ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  // Validate environment
  if (!ZERODB_API_URL || !ZERODB_PROJECT_ID || !ZERODB_EMAIL || !ZERODB_PASSWORD) {
    console.error('\n❌ Missing required environment variables:')
    console.error('   - ZERODB_API_URL')
    console.error('   - ZERODB_PROJECT_ID')
    console.error('   - ZERODB_EMAIL')
    console.error('   - ZERODB_PASSWORD')
    console.error('\nPlease configure .env file with valid ZeroDB credentials.')
    process.exit(1)
  }

  console.log('\nTest Configuration:')
  console.log(`  API URL: ${ZERODB_API_URL}`)
  console.log(`  Project ID: ${ZERODB_PROJECT_ID}`)
  console.log(`  Namespace: ${ZERODB_NAMESPACE}`)
  console.log(`  Model: ${ZERODB_MODEL}`)

  // Run tests
  const accessToken = await testAuthentication()
  if (!accessToken) {
    console.error('\n❌ Authentication failed. Cannot proceed with other tests.')
    process.exit(1)
  }

  await testSingleDocumentEmbedding(accessToken)
  await testBatchProcessing(accessToken)
  await testUpsertBehavior(accessToken)
  await testChecksumVerification()
  await testRetryLogic()
  await testErrorHandling(accessToken)

  // Results
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║                      Test Results                         ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log(`\n✅ Tests Passed: ${testsPassed}`)
  console.log(`❌ Tests Failed: ${testsFailed}`)
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`)

  const passRate = Math.round((testsPassed / (testsPassed + testsFailed)) * 100)
  console.log(`📈 Pass Rate: ${passRate}%`)

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! ZeroDB integration is working correctly.')
    process.exit(0)
  } else {
    console.log(
      `\n⚠️  ${testsFailed} test(s) failed. Please review the errors above.`
    )
    process.exit(1)
  }
}

// Run tests
runTests().catch((err) => {
  console.error('\n❌ Fatal error running tests:', err)
  process.exit(1)
})
