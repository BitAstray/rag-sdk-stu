import type { Loader } from "@rag-sdk/indexing"
import type { Document } from "@rag-sdk/core"
import { lcDocumentToDocument, type LcDocumentLike } from "../shared/document-mapper.js"

export interface LangChainLoaderAdapterOptions {
  /** Any object with a load() method returning LangChain-style documents. */
  lcLoader: { load(): Promise<LcDocumentLike[]> }
}

/**
 * Wraps a LangChain-style loader, converting its output to internal Documents.
 */
export class LangChainLoaderAdapter implements Loader {
  private readonly lcLoader: { load(): Promise<LcDocumentLike[]> }

  constructor(options: LangChainLoaderAdapterOptions) {
    this.lcLoader = options.lcLoader
  }

  async load(): Promise<Document[]> {
    const lcDocs = await this.lcLoader.load()
    return lcDocs.map((doc, i) => lcDocumentToDocument(doc, i))
  }
}
