import { readdir, readFile } from "node:fs/promises"
import { join, extname } from "node:path"
import { LangChainLoaderAdapter } from "./langchain-loader-adapter.js"

/**
 * Convenience preset: loads all markdown files from a directory.
 */
export class MarkdownDirectoryLoader extends LangChainLoaderAdapter {
  constructor(dirPath: string) {
    super({
      lcLoader: {
        async load() {
          const files = await readdir(dirPath)
          const mdFiles = files.filter((f: string) => extname(f) === ".md")

          return Promise.all(
            mdFiles.map(async (file: string) => {
              const filePath = join(dirPath, file)
              const content = await readFile(filePath, "utf-8")
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
