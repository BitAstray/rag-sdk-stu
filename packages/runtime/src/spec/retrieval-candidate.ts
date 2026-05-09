import { z } from "zod"

export const RetrievalCandidateSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  /** Retriever 返回的原始相关性分数 */
  relevanceScore: z.number().optional(),
  /** Postprocessor 赋予的重排序分数 */
  rerankingScore: z.number().optional(),
  embedding: z.array(z.number()).optional(),
  source: z.string().optional(),
})

export type RetrievalCandidate = z.infer<typeof RetrievalCandidateSchema>
