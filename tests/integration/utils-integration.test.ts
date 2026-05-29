import { describe, it, expect } from "vitest"
import { createTimestamp, createId, safeStringify } from "@rag-sdk/utils"

describe("utils integration", () => {
  describe("timestamp", () => {
    it("应生成有效的 ISO 时间戳", () => {
      const ts = createTimestamp()
      const date = new Date(ts)

      expect(date.toISOString()).toBe(ts)
      expect(date.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it("应生成递增的时间戳", () => {
      const ts1 = createTimestamp()
      const ts2 = createTimestamp()

      // 允许相等（同一毫秒内）
      expect(new Date(ts2).getTime()).toBeGreaterThanOrEqual(new Date(ts1).getTime())
    })
  })

  describe("id", () => {
    it("应生成唯一 ID", () => {
      const ids = new Set<string>()
      for (let i = 0; i < 1000; i++) {
        ids.add(createId("test"))
      }

      expect(ids.size).toBe(1000)
    })

    it("应包含前缀", () => {
      const id = createId("trace")
      expect(id).toMatch(/^trace-/)
    })

    it("应生成合理的长度", () => {
      const id = createId("test")
      expect(id.length).toBeGreaterThan(5)
      expect(id.length).toBeLessThan(50)
    })
  })

  describe("safeJson", () => {
    it("应安全序列化普通对象", () => {
      const obj = { name: "test", value: 42 }
      const json = safeStringify(obj)

      expect(json).toBe('{"name":"test","value":42}')
    })

    it("应安全序列化循环引用", () => {
      const obj: any = { name: "test" }
      obj.self = obj

      const json = safeStringify(obj)

      // 循环引用会返回 "[object Object]"
      expect(json).toBeDefined()
    })

    it("应安全序列化 undefined", () => {
      const result = safeStringify(undefined)
      // JSON.stringify(undefined) returns undefined
      expect(result).toBeUndefined()
    })

    it("应安全序列化函数", () => {
      const result = safeStringify(() => {})
      // JSON.stringify(function) returns undefined
      expect(result).toBeUndefined()
    })
  })

  describe("实际场景", () => {
    it("应支持创建 trace 事件", () => {
      const traceId = createId("trace")
      const timestamp = createTimestamp()

      const event = {
        traceId,
        timestamp,
        name: "test.event",
        attributes: { key: "value" },
      }

      const serialized = safeStringify(event)
      const deserialized = JSON.parse(serialized)

      expect(deserialized).toEqual(event)
    })

    it("应支持批量 ID 生成", () => {
      const ids = Array.from({ length: 100 }, () => createId("batch"))

      expect(ids).toHaveLength(100)
      expect(new Set(ids).size).toBe(100)
    })

    it("应支持复杂对象序列化", () => {
      const complex = {
        traceId: createId("trace"),
        timestamp: createTimestamp(),
        events: [
          { name: "event1", data: { nested: true } },
          { name: "event2", data: null },
        ],
        metadata: {
          version: "1.0",
          tags: ["a", "b", "c"],
        },
      }

      const serialized = safeStringify(complex)
      const deserialized = JSON.parse(serialized)

      expect(deserialized).toEqual(complex)
    })
  })
})
