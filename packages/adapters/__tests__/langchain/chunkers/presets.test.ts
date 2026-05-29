import { describe, it, expect } from 'vitest'
import { RecursiveChunker, TokenChunker, MarkdownChunker } from '../../../src/langchain/chunkers/presets.js'
import type { Document } from '@rag-sdk/core'

const createDoc = (content: string, id = 'doc-1'): Document => ({
  id,
  content,
  metadata: {},
})

describe('RecursiveChunker', () => {
  it('应创建 chunker', () => {
    const chunker = new RecursiveChunker()
    expect(chunker).toBeDefined()
  })

  it('应分块短文本', async () => {
    const chunker = new RecursiveChunker({ chunkSize: 100 })
    const doc = createDoc('Short text')

    const chunks = await chunker.chunk(doc)

    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toBe('Short text')
  })

  it('应按段落分块', async () => {
    const chunker = new RecursiveChunker({ chunkSize: 50 })
    const doc = createDoc('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.')

    const chunks = await chunker.chunk(doc)

    expect(chunks.length).toBeGreaterThan(1)
  })

  it('应支持自定义 chunkOverlap', async () => {
    const chunker = new RecursiveChunker({ chunkSize: 30, chunkOverlap: 10 })
    const doc = createDoc('a'.repeat(100))

    const chunks = await chunker.chunk(doc)

    expect(chunks.length).toBeGreaterThan(1)
  })
})

describe('TokenChunker', () => {
  it('应创建 chunker', () => {
    const chunker = new TokenChunker()
    expect(chunker).toBeDefined()
  })

  it('应分块文本', async () => {
    const chunker = new TokenChunker({ chunkSize: 10 })
    const doc = createDoc('word '.repeat(100))

    const chunks = await chunker.chunk(doc)

    expect(chunks.length).toBeGreaterThan(1)
  })
})

describe('MarkdownChunker', () => {
  it('应创建 chunker', () => {
    const chunker = new MarkdownChunker()
    expect(chunker).toBeDefined()
  })

  it('应按标题分块', async () => {
    const chunker = new MarkdownChunker({ chunkSize: 100 })
    const doc = createDoc(`# Header 1
Content 1

## Header 2
Content 2

### Header 3
Content 3`)

    const chunks = await chunker.chunk(doc)

    expect(chunks.length).toBeGreaterThan(1)
  })

  it('应处理大段落', async () => {
    const chunker = new MarkdownChunker({ chunkSize: 50 })
    const doc = createDoc(`# Header
${'a'.repeat(100)}

${'b'.repeat(100)}`)

    const chunks = await chunker.chunk(doc)

    expect(chunks.length).toBeGreaterThan(1)
  })
})
