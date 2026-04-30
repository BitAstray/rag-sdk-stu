import * as nodeFs from "node:fs/promises"
import { join, basename, extname } from "node:path"
import type { Document } from "@rag-sdk/core"
import type { Loader } from "./index.js"

export interface FileSystem {
  readdir(path: string, options: { withFileTypes: true }): Promise<import("node:fs").Dirent[]>
  readFile(path: string, encoding: BufferEncoding): Promise<string>
}

export class MarkdownLoader implements Loader {
  private readonly fs: FileSystem

  constructor(
    private readonly dirPath: string,
    fs?: FileSystem,
  ) {
    this.fs = fs ?? nodeFs
  }

  async load(): Promise<Document[]> {
    const entries = await this.fs.readdir(this.dirPath, { withFileTypes: true })
    const docs: Document[] = []

    for (const entry of entries) {
      if (!entry.isFile() || extname(entry.name) !== ".md") continue
      const filePath = join(this.dirPath, entry.name)
      const content = await this.fs.readFile(filePath, "utf-8")
      const id = basename(entry.name, ".md")
      docs.push({ id, content, metadata: { source: filePath } })
    }

    return docs
  }
}
