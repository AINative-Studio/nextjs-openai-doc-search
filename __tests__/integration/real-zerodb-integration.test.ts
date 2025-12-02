/**
 * Real ZeroDB Integration Tests
 *
 * Tests against actual ZeroDB API with real credentials
 * Target: Comprehensive end-to-end validation
 */

import dotenv from 'dotenv'
import nodeFetch from 'node-fetch'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

// Test timeout for integration tests
jest.setTimeout(60000) // 60 seconds

describe('Real ZeroDB Integration Tests', () => {
  const ZERODB_API_URL = process.env.ZERODB_API_URL!
  const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!
  const ZERODB_EMAIL = process.env.ZERODB_EMAIL!
  const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD!

  let accessToken: string

  describe('Authentication', () => {
    it('should authenticate successfully with real credentials', async () => {
      const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
      })

      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)

      const data = await response.json() as any
      expect(data.access_token).toBeDefined()
      expect(typeof data.access_token).toBe('string')
      expect(data.access_token.length).toBeGreaterThan(0)

      accessToken = data.access_token
    })

    it('should fail with invalid credentials', async () => {
      const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=invalid@example.com&password=wrongpassword`,
      })

      expect(response.ok).toBe(false)
      expect([401, 403]).toContain(response.status)
    })

    it('should return valid JWT token structure', async () => {
      const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
      })

      const data = await response.json() as any
      const token = data.access_token

      // JWT should have 3 parts separated by dots
      const parts = token.split('.')
      expect(parts.length).toBe(3)
    })
  })

  describe('Embeddings Generation', () => {
    beforeAll(async () => {
      if (!accessToken) {
        const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
        })
        const data = await response.json() as any
        accessToken = data.access_token
      }
    })

    it('should generate embeddings for a document', async () => {
      const testDocument = 'ZeroDB is a powerful vector database for semantic search'

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: testDocument,
            model: 'BAAI/bge-small-en-v1.5',
            namespace: 'test-integration',
          }),
        }
      )

      expect(response.ok).toBe(true)
      const data = await response.json() as any

      expect(data.embedding).toBeDefined()
      expect(Array.isArray(data.embedding)).toBe(true)
      expect(data.embedding.length).toBeGreaterThan(0)

      // BGE-small-en-v1.5 produces 384-dimensional embeddings
      expect(data.embedding.length).toBe(384)
    })

    it('should handle empty text input', async () => {
      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: '',
            model: 'BAAI/bge-small-en-v1.5',
            namespace: 'test-integration',
          }),
        }
      )

      // Should either reject empty text or handle gracefully
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should generate different embeddings for different texts', async () => {
      const text1 = 'Machine learning and AI'
      const text2 = 'Cooking recipes and food'

      const [response1, response2] = await Promise.all([
        nodeFetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: text1,
            model: 'BAAI/bge-small-en-v1.5',
            namespace: 'test-integration',
          }),
        }),
        nodeFetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: text2,
            model: 'BAAI/bge-small-en-v1.5',
            namespace: 'test-integration',
          }),
        }),
      ])

      const [data1, data2] = await Promise.all([
        response1.json() as Promise<any>,
        response2.json() as Promise<any>,
      ])

      expect(data1.embedding).not.toEqual(data2.embedding)
    })
  })

  describe('Semantic Search', () => {
    beforeAll(async () => {
      if (!accessToken) {
        const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
        })
        const data = await response.json() as any
        accessToken = data.access_token
      }
    })

    it('should perform semantic search with query', async () => {
      const query = 'How to use vector search?'

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query,
            limit: 5,
            threshold: 0.7,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      expect(response.ok).toBe(true)
      const data = await response.json() as any

      expect(data.results).toBeDefined()
      expect(Array.isArray(data.results)).toBe(true)
    })

    it('should return results with scores', async () => {
      const query = 'vector database features'

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query,
            limit: 3,
            threshold: 0.5,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      const data = await response.json() as any

      if (data.results.length > 0) {
        data.results.forEach((result: any) => {
          expect(result.score).toBeDefined()
          expect(typeof result.score).toBe('number')
          expect(result.score).toBeGreaterThanOrEqual(0)
          expect(result.score).toBeLessThanOrEqual(1)
        })
      }
    })

    it('should respect limit parameter', async () => {
      const query = 'database query'
      const limit = 3

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query,
            limit,
            threshold: 0.5,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      const data = await response.json() as any
      expect(data.results.length).toBeLessThanOrEqual(limit)
    })

    it('should handle invalid namespace gracefully', async () => {
      const query = 'test query'

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query,
            limit: 5,
            threshold: 0.7,
            namespace: 'nonexistent-namespace-12345',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      // Should return empty results or handle gracefully
      expect(response.ok).toBe(true)
      const data = await response.json() as any
      expect(data.results).toBeDefined()
      expect(Array.isArray(data.results)).toBe(true)
    })
  })

  describe('End-to-End RAG Flow', () => {
    it('should complete full RAG pipeline', async () => {
      // Step 1: Authenticate
      const authResponse = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
      })

      expect(authResponse.ok).toBe(true)
      const authData = await authResponse.json() as any
      const token = authData.access_token

      // Step 2: Search for relevant docs
      const searchResponse = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: 'What is semantic search?',
            limit: 3,
            threshold: 0.7,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      expect(searchResponse.ok).toBe(true)
      const searchData = await searchResponse.json() as any
      expect(searchData.results).toBeDefined()

      // Step 3: Verify we can extract context from results
      const context = searchData.results
        .map((r: any) => r.text || r.document)
        .filter(Boolean)
        .join('\n---\n')

      expect(typeof context).toBe('string')
    })
  })

  describe('Performance & Latency', () => {
    beforeAll(async () => {
      if (!accessToken) {
        const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
        })
        const data = await response.json() as any
        accessToken = data.access_token
      }
    })

    it('should complete search within acceptable time (<3s)', async () => {
      const startTime = Date.now()

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: 'vector database performance',
            limit: 5,
            threshold: 0.7,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      const endTime = Date.now()
      const latency = endTime - startTime

      expect(response.ok).toBe(true)
      expect(latency).toBeLessThan(3000) // 3 seconds
    })

    it('should handle concurrent searches', async () => {
      const queries = [
        'What is ZeroDB?',
        'How to use vector embeddings?',
        'Semantic search examples',
      ]

      const startTime = Date.now()

      const responses = await Promise.all(
        queries.map((query) =>
          nodeFetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              query,
              limit: 5,
              threshold: 0.7,
              namespace: 'documentation',
              model: 'BAAI/bge-small-en-v1.5',
            }),
          })
        )
      )

      const endTime = Date.now()
      const totalLatency = endTime - startTime

      responses.forEach((response) => {
        expect(response.ok).toBe(true)
      })

      // Concurrent requests should be faster than sequential
      expect(totalLatency).toBeLessThan(5000) // 5 seconds for 3 concurrent
    })
  })

  describe('Error Handling & Edge Cases', () => {
    it('should handle expired/invalid token', async () => {
      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer invalid-token-12345',
          },
          body: JSON.stringify({
            query: 'test',
            limit: 5,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      expect(response.ok).toBe(false)
      expect([401, 403]).toContain(response.status)
    })

    it('should handle very long query text', async () => {
      if (!accessToken) {
        const authResp = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
        })
        const authData = await authResp.json() as any
        accessToken = authData.access_token
      }

      const longQuery = 'test '.repeat(500) // 2500+ characters

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: longQuery,
            limit: 5,
            threshold: 0.7,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      // Should either succeed or reject gracefully
      expect([200, 400, 413, 422]).toContain(response.status)
    })

    it('should handle invalid project ID', async () => {
      if (!accessToken) {
        const authResp = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`,
        })
        const authData = await authResp.json() as any
        accessToken = authData.access_token
      }

      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/invalid-project-id-12345/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: 'test',
            limit: 5,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
          }),
        }
      )

      expect(response.ok).toBe(false)
      expect([400, 404]).toContain(response.status)
    })
  })
})
