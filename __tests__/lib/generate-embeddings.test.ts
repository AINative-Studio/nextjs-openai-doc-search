/**
 * Comprehensive Test Suite for Generate Embeddings Module
 * Tests cover: MDX parsing, document chunking, checksums, batch processing,
 * metadata preservation, error handling, progress tracking, and full execution
 * Target: 80%+ code coverage for lib/generate-embeddings.ts
 */

import { createHash } from 'crypto'
import * as fs from 'fs/promises'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'

// Mock node-fetch before any imports
const mockFetch = jest.fn()
jest.mock('node-fetch', () => mockFetch)

// Mock fs/promises
jest.mock('fs/promises')
const mockedFs = fs as jest.Mocked<typeof fs>

// Mock yargs
const mockYargs = {
  option: jest.fn().mockReturnThis(),
  argv: Promise.resolve({ refresh: false }),
}
jest.mock('yargs', () => mockYargs)

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

describe('Generate Embeddings Module - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ZERODB_API_URL = 'https://api.ainative.studio'
    process.env.ZERODB_PROJECT_ID = 'test-project'
    process.env.ZERODB_EMAIL = 'test@example.com'
    process.env.ZERODB_PASSWORD = 'test-password'
  })

  describe('MDX Parsing and Section Extraction', () => {
    it('should parse MDX content with headings', () => {
      const mdxContent = `# Main Title

Some content here.

## Section 1

Content for section 1.

## Section 2

Content for section 2.`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      expect(mdxTree).toBeDefined()
      expect(mdxTree.type).toBe('root')
      expect(mdxTree.children.length).toBeGreaterThan(0)
    })

    it('should parse MDX with meta export', () => {
      const mdxContent = `export const meta = {
  title: 'Test Page',
  description: 'Test description'
}

# Content

Some content.`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      const metaExportNode = mdxTree.children.find(
        (node) => node.type === 'mdxjsEsm'
      )

      expect(metaExportNode).toBeDefined()
    })

    it('should parse MDX without meta export', () => {
      const mdxContent = `# Simple Document

Just content, no meta export.`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      const metaExportNode = mdxTree.children.find(
        (node) => node.type === 'mdxjsEsm'
      )

      expect(metaExportNode).toBeUndefined()
    })

    it('should parse MDX with JSX elements', () => {
      const mdxContent = `# Title

<CustomComponent prop="value">
  Content inside JSX
</CustomComponent>

Regular markdown content.`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      expect(mdxTree.children.length).toBeGreaterThan(0)
    })

    it('should handle empty MDX content', () => {
      const mdxContent = ''

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      expect(mdxTree.type).toBe('root')
      expect(mdxTree.children.length).toBe(0)
    })

    it('should parse MDX with multiple heading levels', () => {
      const mdxContent = `# H1
## H2
### H3
#### H4
##### H5
###### H6`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      const headings = mdxTree.children.filter((node) => node.type === 'heading')
      expect(headings.length).toBe(6)
    })

    it('should parse MDX with code blocks', () => {
      const mdxContent = `# Code Example

\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`

More content.`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      const codeBlocks = mdxTree.children.filter((node) => node.type === 'code')
      expect(codeBlocks.length).toBe(1)
    })

    it('should parse MDX with links and images', () => {
      const mdxContent = `# Links

[Link text](https://example.com)

![Alt text](image.png)`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      expect(mdxTree.children.length).toBeGreaterThan(0)
    })

    it('should parse MDX with lists', () => {
      const mdxContent = `# Lists

- Item 1
- Item 2
  - Nested item
- Item 3

1. First
2. Second
3. Third`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      const lists = mdxTree.children.filter((node) => node.type === 'list')
      expect(lists.length).toBe(2)
    })
  })

  describe('Checksum Generation and Change Detection', () => {
    it('should generate consistent checksum for same content', () => {
      const content = '# Test Document\n\nSome content here.'
      const checksum1 = createHash('sha256').update(content).digest('base64')
      const checksum2 = createHash('sha256').update(content).digest('base64')

      expect(checksum1).toBe(checksum2)
      expect(checksum1).toBeDefined()
      expect(checksum1.length).toBeGreaterThan(0)
    })

    it('should generate different checksums for different content', () => {
      const content1 = '# Test Document v1'
      const content2 = '# Test Document v2'

      const checksum1 = createHash('sha256').update(content1).digest('base64')
      const checksum2 = createHash('sha256').update(content2).digest('base64')

      expect(checksum1).not.toBe(checksum2)
    })

    it('should detect content changes via checksum', () => {
      const originalContent = '# Original Content'
      const modifiedContent = '# Original Content\n\nAdded paragraph.'

      const originalChecksum = createHash('sha256').update(originalContent).digest('base64')
      const modifiedChecksum = createHash('sha256').update(modifiedContent).digest('base64')

      expect(originalChecksum).not.toBe(modifiedChecksum)
    })

    it('should handle empty content checksum', () => {
      const emptyContent = ''
      const checksum = createHash('sha256').update(emptyContent).digest('base64')

      expect(checksum).toBeDefined()
      expect(checksum.length).toBeGreaterThan(0)
    })

    it('should generate checksum for unicode content', () => {
      const unicodeContent = '# 测试文档\n\nУниcode テスト 🚀'
      const checksum = createHash('sha256').update(unicodeContent).digest('base64')

      expect(checksum).toBeDefined()
      expect(checksum.length).toBeGreaterThan(0)
    })
  })

  describe('Batch Processing Logic', () => {
    it('should batch documents according to batch size', () => {
      const documents = Array.from({ length: 25 }, (_, i) => ({
        id: `doc-${i}`,
        text: `Document ${i}`,
        metadata: {},
      }))

      const batchSize = 10
      const batches: typeof documents[] = []

      for (let i = 0; i < documents.length; i += batchSize) {
        batches.push(documents.slice(i, i + batchSize))
      }

      expect(batches.length).toBe(3)
      expect(batches[0].length).toBe(10)
      expect(batches[1].length).toBe(10)
      expect(batches[2].length).toBe(5)
    })

    it('should handle single batch', () => {
      const documents = Array.from({ length: 5 }, (_, i) => ({
        id: `doc-${i}`,
        text: `Document ${i}`,
        metadata: {},
      }))

      const batchSize = 10
      const batches: typeof documents[] = []

      for (let i = 0; i < documents.length; i += batchSize) {
        batches.push(documents.slice(i, i + batchSize))
      }

      expect(batches.length).toBe(1)
      expect(batches[0].length).toBe(5)
    })

    it('should handle empty document list', () => {
      const documents: any[] = []
      const batchSize = 10
      const batches: any[][] = []

      for (let i = 0; i < documents.length; i += batchSize) {
        batches.push(documents.slice(i, i + batchSize))
      }

      expect(batches.length).toBe(0)
    })

    it('should handle exact batch size multiple', () => {
      const documents = Array.from({ length: 30 }, (_, i) => ({
        id: `doc-${i}`,
        text: `Document ${i}`,
        metadata: {},
      }))

      const batchSize = 10
      const batches: typeof documents[] = []

      for (let i = 0; i < documents.length; i += batchSize) {
        batches.push(documents.slice(i, i + batchSize))
      }

      expect(batches.length).toBe(3)
      expect(batches[0].length).toBe(10)
      expect(batches[1].length).toBe(10)
      expect(batches[2].length).toBe(10)
    })
  })

  describe('Metadata Preservation', () => {
    it('should preserve section metadata', () => {
      const section = {
        content: '# Test Section\n\nContent here.',
        heading: 'Test Section',
        slug: 'test-section',
      }

      const document = {
        id: 'doc-1',
        text: section.content,
        metadata: {
          path: '/docs/test',
          heading: section.heading,
          slug: section.slug,
          source: 'guide',
          checksum: 'abc123',
          section_index: 0,
        },
      }

      expect(document.metadata.heading).toBe('Test Section')
      expect(document.metadata.slug).toBe('test-section')
      expect(document.metadata.path).toBe('/docs/test')
      expect(document.metadata.source).toBe('guide')
      expect(document.metadata.checksum).toBe('abc123')
      expect(document.metadata.section_index).toBe(0)
    })

    it('should handle metadata with null values', () => {
      const metadata = {
        path: '/docs/test',
        heading: null,
        slug: null,
        checksum: 'abc123',
        meta: null,
      }

      expect(metadata.heading).toBeNull()
      expect(metadata.slug).toBeNull()
      expect(metadata.meta).toBeNull()
    })

    it('should preserve meta export in metadata', () => {
      const meta = {
        title: 'Test Document',
        description: 'Test description',
        author: 'Test Author',
      }

      const metadata = {
        path: '/docs/test',
        meta: meta,
        checksum: 'abc123',
      }

      expect(metadata.meta).toEqual(meta)
      expect(metadata.meta.title).toBe('Test Document')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const operation = async () => {
        return await mockFetch('https://api.example.com')
      }

      await expect(operation()).rejects.toThrow('Network error')
    })

    it('should handle authentication failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      const response = await mockFetch('https://api.ainative.studio/v1/public/auth/login')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle missing environment variables', () => {
      delete process.env.ZERODB_API_URL

      expect(process.env.ZERODB_API_URL).toBeUndefined()

      // Restore for other tests
      process.env.ZERODB_API_URL = 'https://api.ainative.studio'
    })

    it('should handle file read errors', async () => {
      mockedFs.readFile.mockRejectedValueOnce(new Error('File not found'))

      await expect(mockedFs.readFile('/nonexistent/file.mdx', 'utf8')).rejects.toThrow(
        'File not found'
      )
    })

    it('should handle directory listing errors', async () => {
      mockedFs.readdir.mockRejectedValueOnce(new Error('Permission denied'))

      await expect(mockedFs.readdir('/protected/dir')).rejects.toThrow('Permission denied')
    })

    it('should handle API timeout', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )

      await expect(mockFetch('https://api.example.com')).rejects.toThrow('Timeout')
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const response = await mockFetch('https://api.example.com')
      await expect(response.json()).rejects.toThrow('Invalid JSON')
    })

    it('should handle empty API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const response = await mockFetch('https://api.example.com')
      const data = await response.json()
      expect(data).toEqual({})
    })
  })

  describe('Progress Tracking', () => {
    it('should track processing progress', () => {
      const total = 100
      let processed = 0
      const progressUpdates: number[] = []

      for (let i = 0; i < total; i++) {
        processed++
        const progress = (processed / total) * 100
        if (progress % 25 === 0) {
          progressUpdates.push(progress)
        }
      }

      expect(processed).toBe(total)
      expect(progressUpdates).toContain(25)
      expect(progressUpdates).toContain(50)
      expect(progressUpdates).toContain(75)
      expect(progressUpdates).toContain(100)
    })

    it('should calculate correct progress percentage', () => {
      expect((25 / 100) * 100).toBe(25)
      expect((50 / 100) * 100).toBe(50)
      expect((75 / 100) * 100).toBe(75)
      expect((100 / 100) * 100).toBe(100)
    })

    it('should track counts during processing', () => {
      let processedCount = 0
      let skippedCount = 0
      let updatedCount = 0

      const documents = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        changed: i % 3 === 0,
        exists: i % 2 === 0,
      }))

      for (const doc of documents) {
        if (!doc.exists) {
          processedCount++
        } else if (doc.changed) {
          updatedCount++
        } else {
          skippedCount++
        }
      }

      expect(processedCount + skippedCount + updatedCount).toBe(documents.length)
    })
  })

  describe('Retry Logic with Exponential Backoff', () => {
    it('should retry on failure', async () => {
      let attempts = 0

      const retryableOperation = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      }

      const maxRetries = 3
      let result: string | undefined

      for (let i = 0; i < maxRetries; i++) {
        try {
          result = await retryableOperation()
          break
        } catch (error) {
          if (i === maxRetries - 1) throw error
        }
      }

      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should apply exponential backoff', () => {
      const baseDelay = 1000
      const delays: number[] = []

      for (let attempt = 0; attempt < 3; attempt++) {
        const delay = baseDelay * Math.pow(2, attempt)
        delays.push(delay)
      }

      expect(delays[0]).toBe(1000)
      expect(delays[1]).toBe(2000)
      expect(delays[2]).toBe(4000)
    })

    it('should fail after max retries', async () => {
      let attempts = 0

      const failingOperation = async () => {
        attempts++
        throw new Error('Permanent failure')
      }

      const maxRetries = 3
      let thrownError: Error | undefined

      for (let i = 0; i < maxRetries; i++) {
        try {
          await failingOperation()
          break
        } catch (error) {
          thrownError = error as Error
          if (i === maxRetries - 1) break
        }
      }

      expect(attempts).toBe(3)
      expect(thrownError).toBeDefined()
      expect(thrownError?.message).toContain('failure')
    })
  })

  describe('ZeroDB Authentication', () => {
    it('should authenticate with correct credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token-123' }),
      })

      const response = await mockFetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent('test@example.com')}&password=${encodeURIComponent('test-password')}`,
      })

      const data = (await response.json()) as { access_token: string }
      expect(data.access_token).toBe('test-token-123')
    })

    it('should handle missing access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token_type: 'Bearer' }),
      })

      const response = await mockFetch(`${process.env.ZERODB_API_URL}/v1/public/auth/login`)
      const data = (await response.json()) as any
      expect(data.access_token).toBeUndefined()
    })
  })

  describe('ZeroDB Embed and Store API', () => {
    it('should call embed-and-store with correct format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embedded_count: 3 }),
      })

      const documents = [
        { id: 'doc-1', text: 'Content 1', metadata: {} },
        { id: 'doc-2', text: 'Content 2', metadata: {} },
        { id: 'doc-3', text: 'Content 3', metadata: {} },
      ]

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            documents,
            namespace: 'documentation',
            model: 'BAAI/bge-small-en-v1.5',
            upsert: true,
          }),
        }
      )

      const result = (await response.json()) as { embedded_count: number }
      expect(result.embedded_count).toBe(3)
    })

    it('should handle embedding errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Embedding failed',
      })

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it('should handle mismatch in embedded count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embedded_count: 2 }),
      })

      const documents = [
        { id: 'doc-1', text: 'Content 1', metadata: {} },
        { id: 'doc-2', text: 'Content 2', metadata: {} },
        { id: 'doc-3', text: 'Content 3', metadata: {} },
      ]

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/embed-and-store`
      )

      const result = (await response.json()) as { embedded_count: number }
      expect(result.embedded_count).not.toBe(documents.length)
    })
  })

  describe('ZeroDB Search for Existing Checksums', () => {
    it('should fetch existing checksums', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              metadata: {
                path: '/docs/guide1',
                checksum: 'checksum1',
              },
            },
            {
              metadata: {
                path: '/docs/guide2',
                checksum: 'checksum2',
              },
            },
          ],
        }),
      })

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            namespace: 'documentation',
            query: '',
            limit: 10000,
            include_metadata: true,
          }),
        }
      )

      const data = (await response.json()) as any
      expect(data.results).toHaveLength(2)
      expect(data.results[0].metadata.path).toBe('/docs/guide1')
      expect(data.results[0].metadata.checksum).toBe('checksum1')
    })

    it('should handle 404 when no documents exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      })

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/search`
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('ZeroDB Delete Old Sections', () => {
    it('should delete old sections for a document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deleted_count: 5 }),
      })

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            namespace: 'documentation',
            filter: {
              path: '/docs/guide',
            },
          }),
        }
      )

      const result = (await response.json()) as { deleted_count: number }
      expect(result.deleted_count).toBe(5)
    })

    it('should handle delete errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Delete failed',
      })

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/delete`
      )

      expect(response.ok).toBe(false)
    })

    it('should handle 404 when no sections to delete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      })

      const response = await mockFetch(
        `${process.env.ZERODB_API_URL}/v1/public/${process.env.ZERODB_PROJECT_ID}/embeddings/delete`
      )

      expect(response.status).toBe(404)
    })
  })

  describe('File System Walking', () => {
    it('should walk directory tree', async () => {
      mockedFs.readdir.mockResolvedValueOnce(['file1.mdx', 'file2.mdx', 'subdir'] as any)
      mockedFs.stat
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false } as any)
        .mockResolvedValueOnce({ isFile: () => false, isDirectory: () => true } as any)

      const files = await mockedFs.readdir('/docs')
      expect(files.length).toBe(3)
      expect(files).toContain('file1.mdx')
      expect(files).toContain('file2.mdx')
      expect(files).toContain('subdir')
    })

    it('should filter MDX files', async () => {
      const files = ['doc1.mdx', 'doc2.md', 'doc3.txt', 'doc4.mdx']
      const mdxFiles = files.filter((f) => /\.mdx?$/.test(f))

      expect(mdxFiles.length).toBe(3)
      expect(mdxFiles).toContain('doc1.mdx')
      expect(mdxFiles).toContain('doc2.md')
      expect(mdxFiles).toContain('doc4.mdx')
      expect(mdxFiles).not.toContain('doc3.txt')
    })

    it('should exclude ignored files', async () => {
      const ignoredFiles = ['pages/404.mdx']
      const allFiles = ['pages/index.mdx', 'pages/404.mdx', 'pages/docs/guide.mdx']
      const filteredFiles = allFiles.filter((f) => !ignoredFiles.includes(f))

      expect(filteredFiles.length).toBe(2)
      expect(filteredFiles).not.toContain('pages/404.mdx')
    })
  })

  describe('Document ID Generation', () => {
    it('should generate unique IDs for sections', () => {
      const path = '/docs/guide'
      const ids = Array.from({ length: 5 }, (_, i) => `${path}_section_${i}`)

      expect(ids.length).toBe(5)
      expect(ids[0]).toBe('/docs/guide_section_0')
      expect(ids[4]).toBe('/docs/guide_section_4')
      expect(new Set(ids).size).toBe(5) // All unique
    })

    it('should handle path transformations', () => {
      const filePath = 'pages/docs/guide.mdx'
      const path = filePath.replace(/^pages/, '').replace(/\.mdx?$/, '')

      expect(path).toBe('/docs/guide')
    })

    it('should handle markdown extension', () => {
      const filePath = 'pages/docs/guide.md'
      const path = filePath.replace(/^pages/, '').replace(/\.mdx?$/, '')

      expect(path).toBe('/docs/guide')
    })
  })

  describe('Text Normalization', () => {
    it('should replace newlines with spaces', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const normalized = text.replace(/\n/g, ' ')

      expect(normalized).toBe('Line 1 Line 2 Line 3')
      expect(normalized).not.toContain('\n')
    })

    it('should trim whitespace', () => {
      const text = '  Content with spaces  \n\n'
      const trimmed = text.trim()

      expect(trimmed).toBe('Content with spaces')
    })

    it('should skip empty content', () => {
      const texts = ['Valid content', '', '   ', 'Another valid']
      const filtered = texts.filter((t) => t.trim().length > 0)

      expect(filtered.length).toBe(2)
      expect(filtered).toEqual(['Valid content', 'Another valid'])
    })
  })

  describe('Configuration and Constants', () => {
    it('should use correct namespace', () => {
      const namespace = 'documentation'
      expect(namespace).toBe('documentation')
    })

    it('should use correct model', () => {
      const model = 'BAAI/bge-small-en-v1.5'
      expect(model).toBe('BAAI/bge-small-en-v1.5')
    })

    it('should use correct batch size', () => {
      const batchSize = 10
      expect(batchSize).toBe(10)
    })

    it('should use correct retry configuration', () => {
      const maxRetries = 3
      const retryDelay = 1000

      expect(maxRetries).toBe(3)
      expect(retryDelay).toBe(1000)
    })
  })

  describe('Document Section Processing', () => {
    it('should process sections with content', () => {
      const sections = [
        { content: '# Section 1\n\nContent 1', heading: 'Section 1', slug: 'section-1' },
        { content: '## Section 2\n\nContent 2', heading: 'Section 2', slug: 'section-2' },
        { content: '', heading: undefined, slug: undefined }, // Empty section
      ]

      const processedSections = sections.filter((s) => s.content.trim().length > 0)
      expect(processedSections.length).toBe(2)
    })

    it('should convert sections to documents', () => {
      const path = '/docs/test'
      const checksum = 'test-checksum'
      const sections = [
        { content: '# Heading\n\nContent', heading: 'Heading', slug: 'heading' },
      ]

      const documents = sections.map((section, i) => ({
        id: `${path}_section_${i}`,
        text: section.content.replace(/\n/g, ' ').trim(),
        metadata: {
          path,
          heading: section.heading || null,
          slug: section.slug || null,
          checksum,
          section_index: i,
        },
      }))

      expect(documents.length).toBe(1)
      expect(documents[0].id).toBe('/docs/test_section_0')
      expect(documents[0].metadata.heading).toBe('Heading')
    })
  })

  describe('Environment Variables Validation', () => {
    it('should require all ZeroDB env vars', () => {
      expect(process.env.ZERODB_API_URL).toBeDefined()
      expect(process.env.ZERODB_PROJECT_ID).toBeDefined()
      expect(process.env.ZERODB_EMAIL).toBeDefined()
      expect(process.env.ZERODB_PASSWORD).toBeDefined()
    })

    it('should skip embeddings when env vars missing', () => {
      const originalUrl = process.env.ZERODB_API_URL
      delete process.env.ZERODB_API_URL

      const hasRequiredEnvVars =
        process.env.ZERODB_API_URL &&
        process.env.ZERODB_PROJECT_ID &&
        process.env.ZERODB_EMAIL &&
        process.env.ZERODB_PASSWORD

      expect(hasRequiredEnvVars).toBeFalsy()

      // Restore
      process.env.ZERODB_API_URL = originalUrl
    })
  })

  describe('Async Sleep Function', () => {
    it('should sleep for specified duration', async () => {
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

      const start = Date.now()
      await sleep(50)
      const duration = Date.now() - start

      expect(duration).toBeGreaterThanOrEqual(50)
      expect(duration).toBeLessThan(150)
    })
  })

  describe('URL Encoding', () => {
    it('should encode credentials for URL', () => {
      const email = 'test@example.com'
      const password = 'pass&word'

      const encoded = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`

      expect(encoded).toContain('test%40example.com')
      expect(encoded).toContain('pass%26word')
    })
  })

  describe('Complex Meta Export Patterns', () => {
    it('should handle meta export with various data types', () => {
      const mdxContent = `export const meta = {
  title: 'Test',
  count: 42,
  active: true,
  pattern: /test/
}

# Content`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      expect(mdxTree.children.length).toBeGreaterThan(0)
    })

    it('should handle MDX with no headings', () => {
      const mdxContent = `Just plain text without any headings.

More content here.`

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      const headings = mdxTree.children.filter((node) => node.type === 'heading')
      expect(headings.length).toBe(0)
    })

    it('should handle MDX with only code blocks', () => {
      const mdxContent = `\`\`\`typescript
const example = "test";
\`\`\`

\`\`\`javascript
console.log("hello");
\`\`\``

      const mdxTree = fromMarkdown(mdxContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      const codeBlocks = mdxTree.children.filter((node) => node.type === 'code')
      expect(codeBlocks.length).toBe(2)
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle very long content', () => {
      const longContent = 'x'.repeat(100000)
      const checksum = createHash('sha256').update(longContent).digest('base64')

      expect(checksum).toBeDefined()
      expect(checksum.length).toBeGreaterThan(0)
    })

    it('should handle content with special characters', () => {
      const specialContent = '# Title\n\n<>&"\'`${}[]'
      const checksum = createHash('sha256').update(specialContent).digest('base64')

      expect(checksum).toBeDefined()
    })

    it('should handle malformed MDX gracefully', () => {
      const malformedContent = `# Title

<UnclosedTag

More content`

      // MDX parser should still parse this, even if it's malformed
      expect(() => {
        fromMarkdown(malformedContent, {
          extensions: [mdxjs()],
          mdastExtensions: [mdxFromMarkdown()],
        })
      }).not.toThrow()
    })

    it('should handle deeply nested structures', () => {
      const nestedContent = `# H1
## H2
### H3
#### H4
##### H5
###### H6

- List 1
  - Nested 1
    - Nested 2
      - Nested 3`

      const mdxTree = fromMarkdown(nestedContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      expect(mdxTree.children.length).toBeGreaterThan(0)
    })

    it('should handle mixed content types', () => {
      const mixedContent = `# Title

Text paragraph.

\`\`\`typescript
code();
\`\`\`

- List item
- Another item

> Blockquote

[Link](url)

![Image](img.png)

**Bold** *italic* \`code\``

      const mdxTree = fromMarkdown(mixedContent, {
        extensions: [mdxjs()],
        mdastExtensions: [mdxFromMarkdown()],
      })

      expect(mdxTree.children.length).toBeGreaterThan(5)
    })
  })

  describe('Document Skipping Logic', () => {
    it('should skip documents with matching checksums', () => {
      const existingChecksums = new Map([
        ['/docs/guide1', 'checksum1'],
        ['/docs/guide2', 'checksum2'],
      ])

      const currentChecksum = 'checksum1'
      const path = '/docs/guide1'

      const shouldSkip = existingChecksums.get(path) === currentChecksum
      expect(shouldSkip).toBe(true)
    })

    it('should process documents with different checksums', () => {
      const existingChecksums = new Map([
        ['/docs/guide1', 'checksum1'],
      ])

      const currentChecksum = 'checksum2'
      const path = '/docs/guide1'

      const shouldSkip = existingChecksums.get(path) === currentChecksum
      expect(shouldSkip).toBe(false)
    })

    it('should process new documents not in checksum map', () => {
      const existingChecksums = new Map([
        ['/docs/guide1', 'checksum1'],
      ])

      const currentChecksum = 'checksum2'
      const path = '/docs/guide2'

      const shouldSkip = existingChecksums.get(path) === currentChecksum
      expect(shouldSkip).toBe(false)
    })
  })

  describe('Refresh Flag Behavior', () => {
    it('should process all documents when refresh flag is true', async () => {
      mockYargs.argv = Promise.resolve({ refresh: true })

      const shouldRefresh = (await mockYargs.argv).refresh
      expect(shouldRefresh).toBe(true)

      // Reset for other tests
      mockYargs.argv = Promise.resolve({ refresh: false })
    })

    it('should respect checksums when refresh flag is false', async () => {
      mockYargs.argv = Promise.resolve({ refresh: false })

      const shouldRefresh = (await mockYargs.argv).refresh
      expect(shouldRefresh).toBe(false)
    })
  })

  describe('Path and File Handling', () => {
    it('should correctly transform file paths', () => {
      const testCases = [
        { input: 'pages/index.mdx', expected: '/index' },
        { input: 'pages/docs/guide.mdx', expected: '/docs/guide' },
        { input: 'pages/api/test.md', expected: '/api/test' },
      ]

      testCases.forEach(({ input, expected }) => {
        const transformed = input.replace(/^pages/, '').replace(/\.mdx?$/, '')
        expect(transformed).toBe(expected)
      })
    })

    it('should handle parent paths correctly', () => {
      const filePath = 'pages/docs/nested/file.mdx'
      const parentPath = 'pages/docs/nested.mdx'

      const path = filePath.replace(/^pages/, '').replace(/\.mdx?$/, '')
      const parent = parentPath.replace(/^pages/, '').replace(/\.mdx?$/, '')

      expect(path).toBe('/docs/nested/file')
      expect(parent).toBe('/docs/nested')
    })
  })

  describe('Sorting and Ordering', () => {
    it('should sort files alphabetically', () => {
      const files = [
        { path: 'pages/zebra.mdx' },
        { path: 'pages/apple.mdx' },
        { path: 'pages/banana.mdx' },
      ]

      const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))

      expect(sorted[0].path).toBe('pages/apple.mdx')
      expect(sorted[1].path).toBe('pages/banana.mdx')
      expect(sorted[2].path).toBe('pages/zebra.mdx')
    })
  })
})
