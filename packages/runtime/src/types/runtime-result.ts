import type { z } from "zod"
import type { RuntimeResultSchema } from "../spec/runtime-result.js"

export type RuntimeResult = z.infer<typeof RuntimeResultSchema>
