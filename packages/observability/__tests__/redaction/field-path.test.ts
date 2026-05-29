import { describe, it, expect } from 'vitest'
import { parseFieldPath, matchesFieldPath } from '../../src/redaction/field-path.js'

describe('parseFieldPath', () => {
  it('应解析精确匹配路径', () => {
    const result = parseFieldPath('user.name')

    expect(result.type).toBe('exact')
    expect(result.pattern).toBe('user.name')
  })

  it('应解析正则表达式路径', () => {
    const result = parseFieldPath('user\\.name.*')

    expect(result.type).toBe('regex')
    expect(result.pattern).toBeInstanceOf(RegExp)
  })

  it('应识别正则元字符', () => {
    const patterns = [
      'field[0]',
      'field{1}',
      'field+',
      'field*',
      'field?',
      'field^',
      'field$',
      'field|other',
      'field\\d',
      'field(s)',
    ]

    for (const pattern of patterns) {
      const result = parseFieldPath(pattern)
      expect(result.type).toBe('regex')
    }
  })
})

describe('matchesFieldPath', () => {
  it('应匹配精确路径', () => {
    const patterns = [parseFieldPath('user.name')]

    expect(matchesFieldPath('user.name', patterns)).toBe(true)
    expect(matchesFieldPath('user.email', patterns)).toBe(false)
  })

  it('应匹配正则路径', () => {
    const patterns = [parseFieldPath('user\\.\\w+')]

    expect(matchesFieldPath('user.name', patterns)).toBe(true)
    expect(matchesFieldPath('user.email', patterns)).toBe(true)
    expect(matchesFieldPath('order.id', patterns)).toBe(false)
  })

  it('应支持多个模式', () => {
    const patterns = [parseFieldPath('user.name'), parseFieldPath('order.id')]

    expect(matchesFieldPath('user.name', patterns)).toBe(true)
    expect(matchesFieldPath('order.id', patterns)).toBe(true)
    expect(matchesFieldPath('product.name', patterns)).toBe(false)
  })

  it('空模式列表应返回 false', () => {
    expect(matchesFieldPath('any.path', [])).toBe(false)
  })
})
