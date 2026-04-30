import type { z } from "zod"
import type { RuntimeContextSchema } from "../spec/context.js"

export type RuntimeContext = z.infer<typeof RuntimeContextSchema>
