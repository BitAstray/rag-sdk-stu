import { readdir, readFile } from "node:fs/promises"
import { join, basename, extname } from "node:path"
import type { Document } from "@rag-sdk/core"
import type { Loader } from "./types.js"

export class MarkdownLoader implements Loader {
  constructor(private readonly dirPath: string) {}

  async load(): Promise<Document[]> {
    const entries = await readdir(this.dirPath, { withFileTypes: true })
    const docs: Document[] = []

    for (const entry of entries) {
      if (!entry.isFile() || extname(entry.name) !== ".md") continue
      const filePath = join(this.dirPath, entry.name)
      const content = await readFile(filePath, "utf-8")
      const id = basename(entry.name, ".md")
      docs.push({ id, content, metadata: { source: filePath } })
    }

    return docs
  }
}
