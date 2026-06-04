import { describe, it, expect, vi } from "vitest"
import { createEmitter } from "../../src/emit/emit.js"
import type { RAGObserver } from "../../src/types/observer.js"

describe("createEmitter", () => {
  describe("event", () => {
    it("emits event with bound scope and timestamp", () => {
      const observer: RAGObserver = { onEvent: vi.fn() }
      const emitter = createEmitter({ scope: "runtime", traceId: "t1", observer })

      emitter.event("retrieval", "runtime.retrieval.start", { key: "value" }, 100)

      expect(observer.onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          traceId: "t1",
          scope: "runtime",
          stage: "retrieval",
          name: "runtime.retrieval.start",
          durationMs: 100,
          attributes: { key: "value" },
        })
      )
      const arg = (observer.onEvent as any).mock.calls[0][0]
      expect(typeof arg.timestamp).toBe("string")
    })

    it("merges baseAttributes into every event", () => {
      const observer: RAGObserver = { onEvent: vi.fn() }
      const emitter = createEmitter({
        scope: "indexing",
        traceId: "t1",
        observer,
        baseAttributes: { dataset: "d1", version: "v1" },
      })

      emitter.event("load", "indexing.load.complete", { documentCount: 3 })

      expect(observer.onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: "indexing",
          attributes: { dataset: "d1", version: "v1", documentCount: 3 },
        })
      )
    })

    it("call attributes override baseAttributes on key collision", () => {
      const observer: RAGObserver = { onEvent: vi.fn() }
      const emitter = createEmitter({
        scope: "indexing",
        traceId: "t1",
        observer,
        baseAttributes: { dataset: "base" },
      })

      emitter.event("load", "indexing.load.complete", { dataset: "override" })

      expect(observer.onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ attributes: { dataset: "override" } })
      )
    })

    it("is safe with no observer", () => {
      const emitter = createEmitter({ scope: "runtime", traceId: "t1" })
      expect(() => emitter.event("retrieval", "runtime.retrieval.start")).not.toThrow()
    })

    it("is safe with no onEvent callback", () => {
      const emitter = createEmitter({ scope: "runtime", traceId: "t1", observer: {} })
      expect(() => emitter.event("retrieval", "runtime.retrieval.start")).not.toThrow()
    })
  })

  describe("error", () => {
    it("emits error record with bound scope", () => {
      const observer: RAGObserver = { onError: vi.fn() }
      const emitter = createEmitter({ scope: "runtime", traceId: "t1", observer })
      const error = new Error("boom")

      emitter.error("retrieval", "runtime.retrieval.fail", error, { key: "value" })

      expect(observer.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          traceId: "t1",
          scope: "runtime",
          stage: "retrieval",
          name: "runtime.retrieval.fail",
          attributes: { key: "value" },
          error: expect.objectContaining({ name: "Error", message: "boom" }),
        })
      )
    })

    it("merges baseAttributes into error attributes (fixes prior runtime/indexing drift)", () => {
      const observer: RAGObserver = { onError: vi.fn() }
      const emitter = createEmitter({
        scope: "indexing",
        traceId: "t1",
        observer,
        baseAttributes: { dataset: "d1" },
      })

      emitter.error("load", "indexing.load.fail", new Error("x"), { filePath: "/a.md" })

      expect(observer.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: { dataset: "d1", filePath: "/a.md" },
        })
      )
    })

    it("is safe with no observer or callback", () => {
      const emitter = createEmitter({ scope: "runtime", traceId: "t1", observer: {} })
      expect(() => emitter.error("retrieval", "runtime.retrieval.fail", new Error("x"))).not.toThrow()
    })
  })
})
