import { z } from "zod"

export const MetadataValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
])

export const MetadataSchema = z.record(MetadataValue)
