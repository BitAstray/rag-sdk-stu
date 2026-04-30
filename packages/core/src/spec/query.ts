import { z } from "zod"

export const QuerySchema = z.object({
  query: z.string().min(1),
})

export type Query = z.infer<typeof QuerySchema>
