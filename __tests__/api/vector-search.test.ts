/**
 * Comprehensive Test Suite for ZeroDB Vector Search API
 * Tests cover authentication, search, context building, and streaming responses
 * Target: 80%+ code coverage
 */

// Mock edge runtime globals
global.ReadableStream = ReadableStream as any
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock node-fetch before any imports
const mockFetch = jest.fn()
jest.mock('node-fetch', () => mockFetch)

// Mock AbortController
class MockAbortController {
  signal = {}
  abort() {}
}
global.AbortController = MockAbortController as any

describe('ZeroDB Vector Search API', () => {
  let handler: any
  let authenticateZeroDB: any
  let searchDocumentation: any
  let buildContextFromResults: any

  const mockEnv = {
    META_API_KEY: 'test-meta-api-key',
    META_BASE_URL: 'https://api.llama.com/compat/v1',
    META_MODEL: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
    ZERODB_API_URL: 'https://api.ainative.studio',
    ZERODB_PROJECT_ID: 'test-project-id',
    ZERODB_EMAIL: 'test@example.com',
    ZERODB_PASSWORD: 'test-password',
  }

  beforeAll(() => {
    Object.assign(process.env, mockEnv)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Re-import the module
    const module = require('../../pages/api/vector-search')
    handler = module.default
  })

  describe('Environment Validation', () => {
    it('should validate META_API_KEY is present', () => {
      expect(process.env.META_API_KEY).toBeDefined()
    })

    it('should validate ZERODB_API_URL is present', () => {
      expect(process.env.ZERODB_API_URL).toBeDefined()
    })

    it('should validate ZERODB_PROJECT_ID is present', () => {
      expect(process.env.ZERODB_PROJECT_ID).toBeDefined()
    })

    it('should validate all required ZeroDB env vars', () => {
      expect(process.env.ZERODB_EMAIL).toBeDefined()
      expect(process.env.ZERODB_PASSWORD).toBeDefined()
    })
  })

  describe('Request Validation', () => {
    it('should handle missing query parameter', async () => {
      const mockRequest = {
        json: async () => ({}),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing query')
    })

    it('should handle empty query string', async () => {
      const mockRequest = {
        json: async () => ({ prompt: '   ' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Query cannot be empty')
    })

    it('should trim and sanitize query input', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: '  test query  ' }),
      }

      await handler(mockRequest)

      // Verify search was called with trimmed query
      const searchCall = mockFetch.mock.calls.find((call: any) =>
        call[0]?.includes?.('embeddings/search')
      )
      expect(searchCall).toBeDefined()
      const searchBody = JSON.parse(searchCall[1].body)
      expect(searchBody.query).toBe('test query')
    })
  })

  describe('ZeroDB Authentication', () => {
    it('should authenticate with correct credentials', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token-123' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      await handler(mockRequest)

      // Verify auth endpoint was called
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.ainative.studio/v1/public/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'username=test%40example.com&password=test-password',
        })
      )
    })

    it('should handle authentication failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    it('should handle missing access token in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token_type: 'Bearer' }),
        text: async () => '',
      })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  describe('ZeroDB Semantic Search', () => {
    it('should search with correct parameters', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                id: '1',
                score: 0.95,
                text: 'ZeroDB content',
                metadata: {},
              },
            ],
          }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'What is ZeroDB?' }),
      }

      await handler(mockRequest)

      // Verify search call
      const searchCall = mockFetch.mock.calls.find((call: any) =>
        call[0]?.includes?.('embeddings/search')
      )
      expect(searchCall).toBeDefined()

      const searchBody = JSON.parse(searchCall[1].body)
      expect(searchBody.query).toBe('What is ZeroDB?')
      expect(searchBody.limit).toBe(5)
      expect(searchBody.threshold).toBe(0.7)
      expect(searchBody.namespace).toBe('documentation')
      expect(searchBody.model).toBe('BAAI/bge-small-en-v1.5')
    })

    it('should use bearer token for search', async () => {
      const testToken = 'secure-test-token-456'

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: testToken }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      await handler(mockRequest)

      const searchCall = mockFetch.mock.calls.find((call: any) =>
        call[0]?.includes?.('embeddings/search')
      )
      expect(searchCall[1].headers.Authorization).toBe(`Bearer ${testToken}`)
    })

    it('should handle search failures', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Search failed',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(500)
    })

    it('should validate search response format', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ invalid: 'format' }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(500)
    })
  })

  describe('Context Building and Meta Llama Integration', () => {
    it('should build context from search results', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              { id: '1', score: 0.95, text: 'First doc', metadata: {} },
              { id: '2', score: 0.85, document: 'Second doc', metadata: {} },
            ],
          }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      await handler(mockRequest)

      const llamaCall = mockFetch.mock.calls.find((call: any) =>
        call[0]?.includes?.('chat/completions')
      )
      expect(llamaCall).toBeDefined()

      const llamaBody = JSON.parse(llamaCall[1].body)
      expect(llamaBody.messages[0].content).toContain('First doc')
      expect(llamaBody.messages[0].content).toContain('Second doc')
    })

    it('should call Meta Llama with streaming enabled', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      await handler(mockRequest)

      const llamaCall = mockFetch.mock.calls.find((call: any) =>
        call[0]?.includes?.('chat/completions')
      )

      const llamaBody = JSON.parse(llamaCall[1].body)
      expect(llamaBody.stream).toBe(true)
      expect(llamaBody.model).toBe('Llama-4-Maverick-17B-128E-Instruct-FP8')
      expect(llamaBody.max_tokens).toBe(512)
      expect(llamaBody.temperature).toBe(0)
    })

    it('should handle empty search results', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(200)
    })

    it('should handle Meta Llama failures', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Meta Llama error',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(500)
    })
  })

  describe('Streaming Response', () => {
    it('should return streaming response with correct headers', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('test'))
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/plain')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
      expect(response.headers.get('Connection')).toBe('keep-alive')
    })
  })

  describe('End-to-End Flow', () => {
    it('should complete full workflow', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'e2e-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                id: 'doc-1',
                score: 0.95,
                text: 'ZeroDB is a vector database',
                metadata: { source: 'docs' },
              },
            ],
            total: 1,
          }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(
                new TextEncoder().encode('data: {"choices":[{"delta":{"content":"ZeroDB"}}]}\n')
              )
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'What is ZeroDB?' }),
      }

      const response = await handler(mockRequest)

      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledTimes(3)

      // Verify auth
      expect(mockFetch.mock.calls[0][0]).toContain('/auth/login')

      // Verify search
      expect(mockFetch.mock.calls[1][0]).toContain('/embeddings/search')

      // Verify completion
      expect(mockFetch.mock.calls[2][0]).toContain('/chat/completions')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
        text: async () => 'invalid json',
      })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(500)
    })

    it('should handle request body parsing errors', async () => {
      const mockRequest = {
        json: async () => {
          throw new Error('Invalid request body')
        },
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(500)
    })

    it('should handle timeout during search', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockRejectedValueOnce(new Error('Request timeout'))

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(500)
    })

    it('should handle empty results array in context building', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test with no results' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(200)

      // Verify Meta Llama was still called even with no context
      const llamaCall = mockFetch.mock.calls.find((call: any) =>
        call[0]?.includes?.('chat/completions')
      )
      expect(llamaCall).toBeDefined()
    })

    it('should skip documents without content in context building', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              { id: '1', score: 0.95, text: '', metadata: {} }, // Empty text
              { id: '2', score: 0.85, document: 'Valid content', metadata: {} },
              { id: '3', score: 0.75, text: '   ', metadata: {} }, // Whitespace only
            ],
          }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      await handler(mockRequest)

      const llamaCall = mockFetch.mock.calls.find((call: any) =>
        call[0]?.includes?.('chat/completions')
      )
      const llamaBody = JSON.parse(llamaCall[1].body)

      // Should only contain the valid content, not the empty ones
      expect(llamaBody.messages[0].content).toContain('Valid content')
      expect(llamaBody.messages[0].content).not.toContain('id: 1')
      expect(llamaBody.messages[0].content).not.toContain('id: 3')
    })
  })

  describe('Security and Input Sanitization', () => {
    it('should handle special characters in query', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'How to use <script>alert("xss")</script> in ZeroDB?' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(200)
    })

    it('should handle very long queries', async () => {
      const longQuery = 'a'.repeat(10000)

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: longQuery }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(200)
    })
  })

  describe('Individual Environment Variable Validation', () => {
    it('should handle missing META_API_KEY', async () => {
      delete process.env.META_API_KEY

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()

      // Restore
      process.env.META_API_KEY = mockEnv.META_API_KEY
    })

    it('should handle missing META_BASE_URL', async () => {
      delete process.env.META_BASE_URL

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()

      // Restore
      process.env.META_BASE_URL = mockEnv.META_BASE_URL
    })

    it('should handle missing ZERODB_API_URL', async () => {
      delete process.env.ZERODB_API_URL

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()

      // Restore
      process.env.ZERODB_API_URL = mockEnv.ZERODB_API_URL
    })

    it('should handle missing ZERODB_PROJECT_ID', async () => {
      delete process.env.ZERODB_PROJECT_ID

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()

      // Restore
      process.env.ZERODB_PROJECT_ID = mockEnv.ZERODB_PROJECT_ID
    })

    it('should handle missing ZERODB_EMAIL', async () => {
      delete process.env.ZERODB_EMAIL

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()

      // Restore
      process.env.ZERODB_EMAIL = mockEnv.ZERODB_EMAIL
    })

    it('should handle missing ZERODB_PASSWORD', async () => {
      delete process.env.ZERODB_PASSWORD

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()

      // Restore
      process.env.ZERODB_PASSWORD = mockEnv.ZERODB_PASSWORD
    })

    it('should handle null response body in stream', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: null, // Null body
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(200)
    })

    it('should handle SSE parsing errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token' }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true,
          body: new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder()
              // Send invalid JSON
              controller.enqueue(encoder.encode('data: {invalid json}\n\n'))
              controller.close()
            },
          }),
          text: async () => '',
        })

      const mockRequest = {
        json: async () => ({ prompt: 'test' }),
      }

      const response = await handler(mockRequest)
      expect(response.status).toBe(200)
    })
  })
})
