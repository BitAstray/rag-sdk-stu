import { z } from "zod"
import { MetadataValue } from "./metadata.js"

export const ChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(MetadataValue).optional(),
})

export type Chunk = z.infer<typeof ChunkSchema>
