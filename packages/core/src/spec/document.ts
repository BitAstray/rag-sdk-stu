import { z } from "zod"
import { MetadataValue } from "./metadata.js"

export const DocumentSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(MetadataValue).optional(),
})
