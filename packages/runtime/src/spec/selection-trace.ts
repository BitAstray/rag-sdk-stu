import { z } from "zod"

export const SelectionTraceItemSchema = z.object({
  stage: z.string(),
  action: z.enum(["kept", "dropped", "trimmed", "reordered"]),
  candidateId: z.string(),
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type SelectionTraceItem = z.infer<typeof SelectionTraceItemSchema>
