import { createHash } from 'crypto'
import * as dotenv from 'dotenv'
import { ObjectExpression } from 'estree'
import { readdir, readFile, stat } from 'fs/promises'
import GithubSlugger from 'github-slugger'
import { Content, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, MdxjsEsm } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import { mdxjs } from 'micromark-extension-mdxjs'
import nodeFetch from 'node-fetch'
import { basename, dirname, join } from 'path'
import { u } from 'unist-builder'
import { filter } from 'unist-util-filter'
import * as yargs from 'yargs'

dotenv.config()

const ignoredFiles = ['pages/404.mdx']

// ZeroDB Configuration
const ZERODB_API_URL = process.env.ZERODB_API_URL!
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!
const ZERODB_EMAIL = process.env.ZERODB_EMAIL!
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD!
const ZERODB_NAMESPACE = 'documentation'
const ZERODB_MODEL = 'BAAI/bge-small-en-v1.5'
const BATCH_SIZE = 10
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * Retry configuration for ZeroDB API calls
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry wrapper for async functions with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < retries) {
        const backoffDelay = delayMs * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1}/${retries} after ${backoffDelay}ms...`)
        await sleep(backoffDelay)
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Authenticate with ZeroDB and return access token
 */
async function authenticateZeroDB(): Promise<string> {
  console.log('Authenticating with ZeroDB...')

  const authResponse = await withRetry(async () => {
    const response = await nodeFetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(
        ZERODB_PASSWORD
      )}`,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ZeroDB authentication failed: ${response.status} ${errorText}`)
    }

    return response
  })

  const authData = (await authResponse.json()) as { access_token: string }

  if (!authData.access_token) {
    throw new Error('ZeroDB authentication failed: No access token received')
  }

  console.log('Successfully authenticated with ZeroDB')
  return authData.access_token
}

/**
 * Fetch existing checksums from ZeroDB to avoid re-processing unchanged documents
 */
async function fetchExistingChecksums(accessToken: string): Promise<Map<string, string>> {
  console.log('Fetching existing document checksums from ZeroDB...')

  const checksumMap = new Map<string, string>()

  try {
    const response = await withRetry(async () => {
      const res = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            namespace: ZERODB_NAMESPACE,
            query: '',
            limit: 10000, // Fetch all documents
            include_metadata: true,
          }),
        }
      )

      if (!res.ok) {
        // If no documents exist yet, return empty map
        if (res.status === 404) {
          return null
        }
        const errorText = await res.text()
        throw new Error(`Failed to fetch checksums: ${res.status} ${errorText}`)
      }

      return res
    })

    if (!response) {
      console.log('No existing documents found in ZeroDB')
      return checksumMap
    }

    const data = (await response.json()) as {
      results?: Array<{ metadata?: { checksum?: string; path?: string } }>
    }

    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        if (result.metadata?.path && result.metadata?.checksum) {
          checksumMap.set(result.metadata.path, result.metadata.checksum)
        }
      }
    }

    console.log(`Found ${checksumMap.size} existing documents in ZeroDB`)
  } catch (error) {
    console.warn('Warning: Could not fetch existing checksums, will process all documents')
    console.warn(error)
  }

  return checksumMap
}

/**
 * Delete old sections for a document in ZeroDB by path
 */
async function deleteOldSections(
  accessToken: string,
  path: string
): Promise<void> {
  console.log(`Deleting old sections for ${path}...`)

  try {
    await withRetry(async () => {
      const response = await nodeFetch(
        `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            namespace: ZERODB_NAMESPACE,
            filter: {
              path: path,
            },
          }),
        }
      )

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text()
        throw new Error(`Failed to delete old sections: ${response.status} ${errorText}`)
      }
    })
  } catch (error) {
    console.warn(`Warning: Could not delete old sections for ${path}`)
    console.warn(error)
  }
}

/**
 * Embed and store documents in ZeroDB using the auto-embedding API
 */
async function embedAndStoreDocuments(
  accessToken: string,
  documents: Array<{
    id: string
    text: string
    metadata: Record<string, any>
  }>
): Promise<void> {
  const response = await withRetry(async () => {
    const res = await nodeFetch(
      `${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documents: documents,
          namespace: ZERODB_NAMESPACE,
          model: ZERODB_MODEL,
          upsert: true,
        }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`ZeroDB embed-and-store failed: ${res.status} ${errorText}`)
    }

    return res
  })

  const result = (await response.json()) as { embedded_count?: number }

  if (result.embedded_count !== documents.length) {
    console.warn(
      `Warning: Expected to embed ${documents.length} documents, but embedded ${result.embedded_count}`
    )
  }
}

/**
 * Extracts ES literals from an `estree` `ObjectExpression`
 * into a plain JavaScript object.
 */
function getObjectFromExpression(node: ObjectExpression) {
  return node.properties.reduce<
    Record<string, string | number | bigint | true | RegExp | undefined>
  >((object, property) => {
    if (property.type !== 'Property') {
      return object
    }

    const key = (property.key.type === 'Identifier' && property.key.name) || undefined
    const value = (property.value.type === 'Literal' && property.value.value) || undefined

    if (!key) {
      return object
    }

    return {
      ...object,
      [key]: value,
    }
  }, {})
}

/**
 * Extracts the `meta` ESM export from the MDX file.
 *
 * This info is akin to frontmatter.
 */
function extractMetaExport(mdxTree: Root) {
  const metaExportNode = mdxTree.children.find((node): node is MdxjsEsm => {
    return (
      node.type === 'mdxjsEsm' &&
      node.data?.estree?.body[0]?.type === 'ExportNamedDeclaration' &&
      node.data.estree.body[0].declaration?.type === 'VariableDeclaration' &&
      node.data.estree.body[0].declaration.declarations[0]?.id.type === 'Identifier' &&
      node.data.estree.body[0].declaration.declarations[0].id.name === 'meta'
    )
  })

  if (!metaExportNode) {
    return undefined
  }

  const objectExpression =
    (metaExportNode.data?.estree?.body[0]?.type === 'ExportNamedDeclaration' &&
      metaExportNode.data.estree.body[0].declaration?.type === 'VariableDeclaration' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0]?.id.type === 'Identifier' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].id.name === 'meta' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init?.type ===
        'ObjectExpression' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init) ||
    undefined

  if (!objectExpression) {
    return undefined
  }

  return getObjectFromExpression(objectExpression)
}

/**
 * Splits a `mdast` tree into multiple trees based on
 * a predicate function. Will include the splitting node
 * at the beginning of each tree.
 *
 * Useful to split a markdown file into smaller sections.
 */
function splitTreeBy(tree: Root, predicate: (node: Content) => boolean) {
  return tree.children.reduce<Root[]>((trees, node) => {
    const [lastTree] = trees.slice(-1)

    if (!lastTree || predicate(node)) {
      const tree: Root = u('root', [node])
      return trees.concat(tree)
    }

    lastTree.children.push(node)
    return trees
  }, [])
}

type Meta = ReturnType<typeof extractMetaExport>

type Section = {
  content: string
  heading?: string
  slug?: string
}

type ProcessedMdx = {
  checksum: string
  meta: Meta
  sections: Section[]
}

/**
 * Processes MDX content for search indexing.
 * It extracts metadata, strips it of all JSX,
 * and splits it into sub-sections based on criteria.
 */
function processMdxForSearch(content: string): ProcessedMdx {
  const checksum = createHash('sha256').update(content).digest('base64')

  const mdxTree = fromMarkdown(content, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  })

  const meta = extractMetaExport(mdxTree)

  // Remove all MDX elements from markdown
  const mdTree = filter(
    mdxTree,
    (node) =>
      ![
        'mdxjsEsm',
        'mdxJsxFlowElement',
        'mdxJsxTextElement',
        'mdxFlowExpression',
        'mdxTextExpression',
      ].includes(node.type)
  )

  if (!mdTree) {
    return {
      checksum,
      meta,
      sections: [],
    }
  }

  const sectionTrees = splitTreeBy(mdTree, (node) => node.type === 'heading')

  const slugger = new GithubSlugger()

  const sections = sectionTrees.map((tree) => {
    const [firstNode] = tree.children

    const heading = firstNode.type === 'heading' ? toString(firstNode) : undefined
    const slug = heading ? slugger.slug(heading) : undefined

    return {
      content: toMarkdown(tree),
      heading,
      slug,
    }
  })

  return {
    checksum,
    meta,
    sections,
  }
}

type WalkEntry = {
  path: string
  parentPath?: string
}

async function walk(dir: string, parentPath?: string): Promise<WalkEntry[]> {
  const immediateFiles = await readdir(dir)

  const recursiveFiles = await Promise.all(
    immediateFiles.map(async (file) => {
      const path = join(dir, file)
      const stats = await stat(path)
      if (stats.isDirectory()) {
        // Keep track of document hierarchy (if this dir has corresponding doc file)
        const docPath = `${basename(path)}.mdx`

        return walk(
          path,
          immediateFiles.includes(docPath) ? join(dirname(path), docPath) : parentPath
        )
      } else if (stats.isFile()) {
        return [
          {
            path: path,
            parentPath,
          },
        ]
      } else {
        return []
      }
    })
  )

  const flattenedFiles = recursiveFiles.reduce(
    (all, folderContents) => all.concat(folderContents),
    []
  )

  return flattenedFiles.sort((a, b) => a.path.localeCompare(b.path))
}

abstract class BaseEmbeddingSource {
  checksum?: string
  meta?: Meta
  sections?: Section[]

  constructor(public source: string, public path: string, public parentPath?: string) {}

  abstract load(): Promise<{
    checksum: string
    meta?: Meta
    sections: Section[]
  }>
}

class MarkdownEmbeddingSource extends BaseEmbeddingSource {
  type: 'markdown' = 'markdown'

  constructor(source: string, public filePath: string, public parentFilePath?: string) {
    const path = filePath.replace(/^pages/, '').replace(/\.mdx?$/, '')
    const parentPath = parentFilePath?.replace(/^pages/, '').replace(/\.mdx?$/, '')

    super(source, path, parentPath)
  }

  async load() {
    const contents = await readFile(this.filePath, 'utf8')

    const { checksum, meta, sections } = processMdxForSearch(contents)

    this.checksum = checksum
    this.meta = meta
    this.sections = sections

    return {
      checksum,
      meta,
      sections,
    }
  }
}

type EmbeddingSource = MarkdownEmbeddingSource

/**
 * Main function to generate embeddings using ZeroDB
 */
async function generateEmbeddings() {
  const argv = await yargs.option('refresh', {
    alias: 'r',
    description: 'Refresh all embeddings (ignore checksums)',
    type: 'boolean',
  }).argv

  const shouldRefresh = argv.refresh

  // Validate environment variables
  if (!ZERODB_API_URL || !ZERODB_PROJECT_ID || !ZERODB_EMAIL || !ZERODB_PASSWORD) {
    return console.log(
      'Environment variables ZERODB_API_URL, ZERODB_PROJECT_ID, ZERODB_EMAIL, and ZERODB_PASSWORD are required: skipping embeddings generation'
    )
  }

  console.log('Starting ZeroDB embeddings generation...')
  console.log(`ZeroDB API URL: ${ZERODB_API_URL}`)
  console.log(`ZeroDB Project ID: ${ZERODB_PROJECT_ID}`)
  console.log(`Namespace: ${ZERODB_NAMESPACE}`)
  console.log(`Model: ${ZERODB_MODEL}`)
  console.log(`Batch Size: ${BATCH_SIZE}`)

  // Authenticate with ZeroDB
  const accessToken = await authenticateZeroDB()

  // Discover all MDX files
  const embeddingSources: EmbeddingSource[] = [
    ...(await walk('pages'))
      .filter(({ path }) => /\.mdx?$/.test(path))
      .filter(({ path }) => !ignoredFiles.includes(path))
      .map((entry) => new MarkdownEmbeddingSource('guide', entry.path)),
  ]

  console.log(`Discovered ${embeddingSources.length} pages`)

  // Fetch existing checksums (unless refresh is forced)
  let existingChecksums = new Map<string, string>()
  if (!shouldRefresh) {
    console.log('Checking which pages are new or have changed')
    existingChecksums = await fetchExistingChecksums(accessToken)
  } else {
    console.log('Refresh flag set, re-generating all pages')
  }

  // Process each source and collect documents for batching
  let documentsToEmbed: Array<{
    id: string
    text: string
    metadata: Record<string, any>
  }> = []
  let processedCount = 0
  let skippedCount = 0
  let updatedCount = 0

  for (const embeddingSource of embeddingSources) {
    const { source, path } = embeddingSource

    try {
      const { checksum, meta, sections } = await embeddingSource.load()

      // Check if document has changed
      const existingChecksum = existingChecksums.get(path)
      if (!shouldRefresh && existingChecksum === checksum) {
        console.log(`[${path}] Unchanged (checksum match), skipping`)
        skippedCount++
        continue
      }

      if (existingChecksum && existingChecksum !== checksum) {
        console.log(`[${path}] Document changed, deleting old sections`)
        await deleteOldSections(accessToken, path)
        updatedCount++
      } else {
        console.log(`[${path}] New document, processing ${sections.length} sections`)
      }

      // Convert sections to ZeroDB documents
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        // Replace newlines with spaces for better embedding quality
        const text = section.content.replace(/\n/g, ' ').trim()

        if (!text) {
          continue
        }

        documentsToEmbed.push({
          id: `${path}_section_${i}`,
          text: text,
          metadata: {
            path: path,
            source: source,
            heading: section.heading || null,
            slug: section.slug || null,
            checksum: checksum,
            meta: meta || null,
            section_index: i,
          },
        })
      }

      processedCount++

      // Batch embed when we reach BATCH_SIZE
      if (documentsToEmbed.length >= BATCH_SIZE) {
        const batch = documentsToEmbed.splice(0, BATCH_SIZE)
        console.log(`Embedding and storing batch of ${batch.length} documents...`)
        await embedAndStoreDocuments(accessToken, batch)
      }
    } catch (error) {
      console.error(`Error processing ${path}:`, error)
      console.error(
        `Page '${path}' failed to process. It may need to be re-generated on next run.`
      )
    }
  }

  // Embed remaining documents
  if (documentsToEmbed.length > 0) {
    console.log(`Embedding and storing final batch of ${documentsToEmbed.length} documents...`)
    await embedAndStoreDocuments(accessToken, documentsToEmbed)
  }

  console.log('\n=== Embedding Generation Complete ===')
  console.log(`Total pages discovered: ${embeddingSources.length}`)
  console.log(`Pages processed: ${processedCount}`)
  console.log(`Pages updated: ${updatedCount}`)
  console.log(`Pages skipped (unchanged): ${skippedCount}`)
  console.log(`Namespace: ${ZERODB_NAMESPACE}`)
  console.log(`Model: ${ZERODB_MODEL} (384 dimensions, FREE!)`)
}

async function main() {
  await generateEmbeddings()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
