/**
 * Redaction 配置
 *
 * fields 支持点路径和正则表达式
 * 内容字段（query、content、prompt、answer 等）受 maskContent 控制
 */
export interface RedactionOptions {
  /** 需要脱敏的字段路径（支持正则） */
  fields?: string[]
  /** 是否截断内容字段，默认 true */
  maskContent?: boolean
  /** 内容预览长度，默认 200 */
  contentPreviewLength?: number
  /** 替换文本，默认 "[REDACTED]" */
  replacement?: string
}
