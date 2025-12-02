import type { NextRequest } from 'next/server'
import { codeBlock, oneLine } from 'common-tags'
import GPT3Tokenizer from 'gpt3-tokenizer'
import nodeFetch from 'node-fetch'
import { ApplicationError, UserError } from '@/lib/errors'

// Environment variables
const metaApiKey = process.env.META_API_KEY
const metaBaseUrl = process.env.META_BASE_URL
const metaModel = process.env.META_MODEL
const zerodbApiUrl = process.env.ZERODB_API_URL
const zerodbProjectId = process.env.ZERODB_PROJECT_ID
const zerodbEmail = process.env.ZERODB_EMAIL
const zerodbPassword = process.env.ZERODB_PASSWORD

export const runtime = 'edge'

/**
 * ZeroDB Authentication Result
 */
interface ZeroDBAuthResponse {
  access_token: string
  token_type?: string
  expires_in?: number
}

/**
 * ZeroDB Search Result
 */
interface ZeroDBSearchResult {
  id: string
  score: number
  text?: string
  document?: string
  metadata?: Record<string, any>
}

/**
 * ZeroDB Search Response
 */
interface ZeroDBSearchResponse {
  results: ZeroDBSearchResult[]
  total?: number
  query?: string
}

/**
 * Authenticate with ZeroDB and retrieve access token
 */
async function authenticateZeroDB(): Promise<string> {
  if (!zerodbApiUrl || !zerodbEmail || !zerodbPassword) {
    throw new ApplicationError('Missing ZeroDB configuration', {
      missing: [
        !zerodbApiUrl && 'ZERODB_API_URL',
        !zerodbEmail && 'ZERODB_EMAIL',
        !zerodbPassword && 'ZERODB_PASSWORD',
      ].filter(Boolean),
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout for auth

  try {
    const authResponse = await nodeFetch(`${zerodbApiUrl}/v1/public/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(zerodbEmail)}&password=${encodeURIComponent(
        zerodbPassword
      )}`,
      signal: controller.signal as any,
    })

    clearTimeout(timeout)

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      throw new ApplicationError('ZeroDB authentication failed', {
        status: authResponse.status,
        error: errorText,
      })
    }

    const authData = (await authResponse.json()) as ZeroDBAuthResponse

    if (!authData.access_token) {
      throw new ApplicationError('No access token returned from ZeroDB')
    }

    return authData.access_token
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof ApplicationError) {
      throw error
    }
    throw new ApplicationError('Failed to authenticate with ZeroDB', { error })
  }
}

/**
 * Search for relevant documentation using ZeroDB semantic search
 * ZeroDB automatically generates embeddings from the query using BAAI/bge-small-en-v1.5
 */
async function searchDocumentation(
  query: string,
  accessToken: string
): Promise<ZeroDBSearchResult[]> {
  if (!zerodbApiUrl || !zerodbProjectId) {
    throw new ApplicationError('Missing ZeroDB configuration', {
      missing: [!zerodbApiUrl && 'ZERODB_API_URL', !zerodbProjectId && 'ZERODB_PROJECT_ID'].filter(
        Boolean
      ),
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15 second timeout for search

  try {
    const searchResponse = await nodeFetch(
      `${zerodbApiUrl}/v1/public/${zerodbProjectId}/embeddings/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: query,
          limit: 5, // Top 5 most relevant documents
          threshold: 0.7, // Similarity threshold
          namespace: 'documentation',
          model: 'BAAI/bge-small-en-v1.5', // Free HuggingFace embeddings
        }),
        signal: controller.signal as any,
      }
    )

    clearTimeout(timeout)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      throw new ApplicationError('ZeroDB search failed', {
        status: searchResponse.status,
        error: errorText,
      })
    }

    const searchData = (await searchResponse.json()) as ZeroDBSearchResponse

    if (!searchData.results || !Array.isArray(searchData.results)) {
      throw new ApplicationError('Invalid search response from ZeroDB', { searchData })
    }

    return searchData.results
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof ApplicationError) {
      throw error
    }
    throw new ApplicationError('Failed to search documentation', { error })
  }
}

/**
 * Build context from search results with token limit
 */
function buildContextFromResults(results: ZeroDBSearchResult[], maxTokens: number = 1500): string {
  const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
  let tokenCount = 0
  let contextText = ''

  for (const result of results) {
    // Get text content from result (could be 'text' or 'document' field)
    const content = result.text || result.document || ''

    if (!content.trim()) {
      continue
    }

    const encoded = tokenizer.encode(content)
    tokenCount += encoded.text.length

    if (tokenCount >= maxTokens) {
      break
    }

    contextText += `${content.trim()}\n---\n`
  }

  return contextText
}

/**
 * Stream Meta Llama completion response
 */
async function streamMetaLlamaCompletion(
  prompt: string,
  query: string
): Promise<ReadableStream<Uint8Array>> {
  if (!metaApiKey || !metaBaseUrl) {
    throw new ApplicationError('Missing Meta Llama configuration', {
      missing: [!metaApiKey && 'META_API_KEY', !metaBaseUrl && 'META_BASE_URL'].filter(Boolean),
    })
  }

  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    const apiResponse = await nodeFetch(`${metaBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${metaApiKey}`,
      },
      body: JSON.stringify({
        model: metaModel || 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages,
        max_tokens: 512,
        temperature: 0,
        stream: true,
      }),
      signal: controller.signal as any,
    })

    clearTimeout(timeout)

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      throw new ApplicationError('Failed to generate completion', {
        status: apiResponse.status,
        error: errorText,
      })
    }

    // Create a TransformStream to handle streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!apiResponse.body) {
            controller.close()
            return
          }

          const reader = apiResponse.body.getReader()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              controller.close()
              break
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true })

            // Process complete lines from buffer
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine || trimmedLine === 'data: [DONE]') continue

              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6)
                  const parsed = JSON.parse(jsonStr)
                  const content = parsed.choices?.[0]?.delta?.content

                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.error('Failed to parse SSE data:', e)
                }
              }
            }
          }
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return stream
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

/**
 * Main API handler for vector search with streaming response
 */
export default async function handler(req: NextRequest) {
  try {
    // Validate environment variables
    if (!metaApiKey) {
      throw new ApplicationError('Missing environment variable META_API_KEY')
    }

    if (!metaBaseUrl) {
      throw new ApplicationError('Missing environment variable META_BASE_URL')
    }

    if (!zerodbApiUrl) {
      throw new ApplicationError('Missing environment variable ZERODB_API_URL')
    }

    if (!zerodbProjectId) {
      throw new ApplicationError('Missing environment variable ZERODB_PROJECT_ID')
    }

    if (!zerodbEmail) {
      throw new ApplicationError('Missing environment variable ZERODB_EMAIL')
    }

    if (!zerodbPassword) {
      throw new ApplicationError('Missing environment variable ZERODB_PASSWORD')
    }

    const requestData = await req.json()

    if (!requestData) {
      throw new UserError('Missing request data')
    }

    const { prompt: query } = requestData

    if (!query) {
      throw new UserError('Missing query in request data')
    }

    // Sanitize the query
    const sanitizedQuery = query.trim()

    if (!sanitizedQuery) {
      throw new UserError('Query cannot be empty')
    }

    // Step 1: Authenticate with ZeroDB
    const accessToken = await authenticateZeroDB()

    // Step 2: Search for relevant documentation using ZeroDB semantic search
    // ZeroDB automatically generates embeddings from the query
    const searchResults = await searchDocumentation(sanitizedQuery, accessToken)

    // Step 3: Build context from search results
    const contextText = buildContextFromResults(searchResults)

    // Step 4: Generate Meta Llama prompt
    const prompt = codeBlock`
      ${oneLine`
        You are a helpful AI assistant who provides accurate information
        based on the provided documentation. Given the following sections from the
        documentation, answer the question using only that information,
        outputted in markdown format. If you are unsure and the answer
        is not explicitly written in the documentation, say
        "Sorry, I don't know how to help with that."
      `}

      Context sections:
      ${contextText}

      Question: """
      ${sanitizedQuery}
      """

      Answer as markdown (including related code snippets if available):
    `

    // Step 5: Stream Meta Llama completion
    const stream = await streamMetaLlamaCompletion(prompt, sanitizedQuery)

    // Return a streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } else if (err instanceof ApplicationError) {
      // Print out application errors with their additional data
      console.error(`${err.message}: ${JSON.stringify(err.data)}`)
    } else {
      // Print out unexpected errors as is to help with debugging
      console.error(err)
    }

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
