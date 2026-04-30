import type { z } from "zod"
import type { DocumentSchema } from "../spec/document.js"

export type Document = z.infer<typeof DocumentSchema>
