export interface RetrievalDebugData {
  [key: string]: unknown
}

export interface PostRetrievalDebugData {
  [key: string]: unknown
}

export interface GenerationDebugData {
  [key: string]: unknown
}

export interface RuntimeMetadata {
  retrievalDebug?: RetrievalDebugData
  postRetrievalDebug?: PostRetrievalDebugData
  generationDebug?: GenerationDebugData
  [key: string]: unknown
}
