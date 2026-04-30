import type { z } from "zod"
import type { ChunkSchema } from "../spec/chunk.js"

export type Chunk = z.infer<typeof ChunkSchema>
