import { createTimestamp, createId, createTraceId, safeStringify, toSerializable } from "../src/index.js"

console.log("=== @rag-sdk/utils Demo ===\n")

// Timestamp
console.log("--- createTimestamp ---")
console.log("Current time:", createTimestamp())

// ID generation
console.log("\n--- createId ---")
console.log("Default ID:", createId())
console.log("Trace ID:  ", createId("trace"))
console.log("Custom ID: ", createId("session"))

// Backward-compatible alias
console.log("\n--- createTraceId (alias) ---")
console.log("Trace ID:", createTraceId())

// Safe JSON
console.log("\n--- safeStringify ---")
const circular: any = { name: "test" }
circular.self = circular
console.log("Circular ref:", safeStringify(circular))
console.log("Normal:     ", safeStringify({ hello: "world" }, 2))

// Serializable
console.log("\n--- toSerializable ---")
console.log("Date: ", toSerializable(new Date()))
console.log("Error:", toSerializable(new Error("something failed")))
console.log("Func: ", toSerializable(() => "hidden"))

console.log("\n=== Demo Complete ===")
