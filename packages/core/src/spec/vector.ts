import { z } from "zod"
import { MetadataValue } from "./metadata.js"

export const VectorSchema = z.object({
  id: z.string(),
  values: z.array(z.number()),
  metadata: z.record(MetadataValue).optional(),
})
