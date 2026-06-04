/**
 * 调试数据
 *
 * 各运行时阶段（retrieval / post-retrieval / generation）可选携带的非契约调试信息。
 * 故意是开放的键值袋：调试字段不构成接口契约，调用方不应据此分支逻辑。
 *
 * 注意：这里只保留一个类型。早先按阶段拆成三个结构完全相同的类型
 * （RetrievalDebugData / PostRetrievalDebugData / GenerationDebugData），
 * 它们与彼此、与 Record<string, unknown> 都无法区分，已收敛为单一 DebugData。
 */
export interface DebugData {
  [key: string]: unknown
}
