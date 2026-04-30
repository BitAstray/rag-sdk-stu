import {
  LangChainChunkerAdapter,
  type SplitterLike,
} from "./langchain-chunker-adapter.js"

export interface ChunkerPresetOptions {
  chunkSize?: number
  chunkOverlap?: number
}

/**
 * Built-in recursive character splitter.
 * Splits by separators: ["\n\n", "\n", " ", ""] with decreasing priority.
 */
class RecursiveCharacterSplitter implements SplitterLike {
  private readonly chunkSize: number
  private readonly chunkOverlap: number

  constructor(options?: ChunkerPresetOptions) {
    this.chunkSize = options?.chunkSize ?? 500
    this.chunkOverlap = options?.chunkOverlap ?? 50
  }

  async splitDocuments(
    docs: { pageContent: string; metadata?: Record<string, unknown> }[],
  ) {
    const results: { pageContent: string; metadata?: Record<string, unknown> }[] = []
    for (const doc of docs) {
      const chunks = this.splitText(doc.pageContent)
      for (const chunk of chunks) {
        results.push({ pageContent: chunk, metadata: { ...doc.metadata } })
      }
    }
    return results
  }

  private splitText(text: string): string[] {
    const separators = ["\n\n", "\n", " ", ""]
    return this.recursiveSplit(text, separators)
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    if (text.length <= this.chunkSize) return [text]

    const sep = separators[0] ?? ""
    const rest = separators.slice(1)

    const parts = sep ? text.split(sep) : splitByChar(text, this.chunkSize)
    const chunks: string[] = []
    let current = ""

    for (const part of parts) {
      if (current.length + part.length + sep.length <= this.chunkSize) {
        current = current ? current + sep + part : part
      } else {
        if (current) chunks.push(current)
        if (part.length > this.chunkSize && rest.length > 0) {
          chunks.push(...this.recursiveSplit(part, rest))
        } else {
          current = part
        }
      }
    }
    if (current) chunks.push(current)

    // Apply overlap
    if (this.chunkOverlap > 0 && chunks.length > 1) {
      return applyOverlap(chunks, this.chunkOverlap)
    }
    return chunks
  }
}

function splitByChar(text: string, size: number): string[] {
  const result: string[] = []
  for (let i = 0; i < text.length; i += size) {
    result.push(text.slice(i, i + size))
  }
  return result
}

function applyOverlap(chunks: string[], overlap: number): string[] {
  if (chunks.length <= 1) return chunks
  const result: string[] = [chunks[0]]
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1]
    const overlapText = prev.slice(-overlap)
    result.push(overlapText + chunks[i])
  }
  return result
}

/**
 * Recursive character text splitter preset.
 * Splits text by progressively trying separators: paragraph → line → word → char.
 */
export class RecursiveChunker extends LangChainChunkerAdapter {
  constructor(options?: ChunkerPresetOptions) {
    super({ splitter: new RecursiveCharacterSplitter(options) })
  }
}

/**
 * Token-based splitter preset.
 * Splits by approximate token count (words / 0.75).
 */
export class TokenChunker extends LangChainChunkerAdapter {
  constructor(options?: ChunkerPresetOptions) {
    const tokenSize = options?.chunkSize ?? 500
    const tokenOverlap = options?.chunkOverlap ?? 50
    // Approximate: 1 token ≈ 4 chars for English
    super({
      splitter: new RecursiveCharacterSplitter({
        chunkSize: tokenSize * 4,
        chunkOverlap: tokenOverlap * 4,
      }),
    })
  }
}

/**
 * Markdown-aware splitter preset.
 * Splits respecting markdown structure (headers, code blocks, paragraphs).
 */
export class MarkdownChunker extends LangChainChunkerAdapter {
  constructor(options?: ChunkerPresetOptions) {
    const chunkSize = options?.chunkSize ?? 500
    const chunkOverlap = options?.chunkOverlap ?? 50

    super({
      splitter: createMarkdownSplitter(chunkSize, chunkOverlap),
    })
  }
}

function createMarkdownSplitter(chunkSize: number, chunkOverlap: number): SplitterLike {
  return {
    async splitDocuments(docs) {
      const results: { pageContent: string; metadata?: Record<string, unknown> }[] = []
      for (const doc of docs) {
        const chunks = splitMarkdown(doc.pageContent, chunkSize, chunkOverlap)
        for (const chunk of chunks) {
          results.push({ pageContent: chunk, metadata: { ...doc.metadata } })
        }
      }
      return results
    },
  }
}

function splitMarkdown(text: string, chunkSize: number, _overlap: number): string[] {
  // Split by headers first, then by paragraphs
  const sections = text.split(/(?=^#{1,6}\s)/m)
  const chunks: string[] = []

  for (const section of sections) {
    if (section.length <= chunkSize) {
      if (section.trim()) chunks.push(section.trim())
      continue
    }
    // Split large sections by double newline
    const paragraphs = section.split(/\n\n+/)
    let current = ""
    for (const para of paragraphs) {
      if (current.length + para.length + 2 <= chunkSize) {
        current = current ? current + "\n\n" + para : para
      } else {
        if (current.trim()) chunks.push(current.trim())
        current = para
      }
    }
    if (current.trim()) chunks.push(current.trim())
  }

  return chunks.filter((c) => c.length > 0)
}
