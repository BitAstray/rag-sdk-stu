import type { z } from "zod"
import type { QuerySchema } from "../spec/query.js"

export type Query = z.infer<typeof QuerySchema>
