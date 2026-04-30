import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { MarkdownLoader } from "../../src/loaders/markdown-loader.js"

describe("MarkdownLoader", () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "md-loader-test-"))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("loads markdown files from a directory", async () => {
    writeFileSync(join(dir, "a.md"), "# Hello")
    writeFileSync(join(dir, "b.md"), "# World")
    const loader = new MarkdownLoader(dir)
    const docs = await loader.load()
    expect(docs).toHaveLength(2)
    expect(docs.map((d) => d.content).sort()).toEqual(["# Hello", "# World"])
  })

  it("ignores non-markdown files", async () => {
    writeFileSync(join(dir, "a.md"), "# MD")
    writeFileSync(join(dir, "b.txt"), "not markdown")
    const loader = new MarkdownLoader(dir)
    const docs = await loader.load()
    expect(docs).toHaveLength(1)
  })

  it("returns empty array for empty directory", async () => {
    const loader = new MarkdownLoader(dir)
    const docs = await loader.load()
    expect(docs).toHaveLength(0)
  })

  it("sets document id based on filename", async () => {
    writeFileSync(join(dir, "my-doc.md"), "# Content")
    const loader = new MarkdownLoader(dir)
    const docs = await loader.load()
    expect(docs[0].id).toContain("my-doc")
  })
})
