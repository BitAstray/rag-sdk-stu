import * as nodeFs from "node:fs/promises"
import { join, extname } from "node:path"
import { LangChainLoaderAdapter } from "./langchain-loader-adapter.js"

export interface FileSystem {
  readdir(path: string): Promise<string[]>
  readFile(path: string, encoding: BufferEncoding): Promise<string>
}

/**
 * Convenience preset: loads all markdown files from a directory.
 */
export class MarkdownDirectoryLoader extends LangChainLoaderAdapter {
  constructor(dirPath: string, fs?: FileSystem) {
    const fileSystem = fs ?? nodeFs
    super({
      lcLoader: {
        async load() {
          const files = await fileSystem.readdir(dirPath)
          const mdFiles = files.filter((f: string) => extname(f) === ".md")

          return Promise.all(
            mdFiles.map(async (file: string) => {
              const filePath = join(dirPath, file)
              const content = await fileSystem.readFile(filePath, "utf-8")
              return {
                pageContent: content,
                metadata: { source: filePath },
              }
            }),
          )
        },
      },
    })
  }
}
