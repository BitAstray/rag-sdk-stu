import type { z } from "zod"
import type { VectorSchema } from "../spec/vector.js"

export type Vector = z.infer<typeof VectorSchema>
