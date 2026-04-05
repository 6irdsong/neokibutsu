import { describe, it, expect } from 'vitest'
import { normalizeSearch } from '@/lib/normalize'

describe('normalizeSearch', () => {
  it('converts fullwidth to halfwidth', () => {
    expect(normalizeSearch('Ａ')).toBe('a')
  })

  it('converts roman numerals to arabic', () => {
    expect(normalizeSearch('微分積分学II')).toBe('微分積分学2')
    expect(normalizeSearch('物理学III')).toBe('物理学3')
  })

  it('lowercases latin chars', () => {
    expect(normalizeSearch('ABC')).toBe('abc')
  })

  it('strips punctuation and whitespace', () => {
    expect(normalizeSearch('線形代数学（理系）')).toBe('線形代数学理系')
    expect(normalizeSearch('テスト　テスト')).toBe('テストテスト')
  })

  it('handles NFKC roman numeral Ⅱ→II→2', () => {
    expect(normalizeSearch('物理学Ⅱ')).toBe('物理学2')
  })

  it('converts IV to 4', () => {
    expect(normalizeSearch('化学IV')).toBe('化学4')
  })

  it('does not convert lone I before a letter', () => {
    expect(normalizeSearch('Introduction')).toBe('introduction')
  })

  it('strips dashes and katakana prolonged sound', () => {
    expect(normalizeSearch('データー分析')).toBe('デタ分析')
  })

  it('strips brackets and symbols', () => {
    expect(normalizeSearch('基礎【数学】<入門>')).toBe('基礎数学入門')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeSearch('')).toBe('')
  })

  it('handles mixed fullwidth and halfwidth', () => {
    expect(normalizeSearch('ＡＢＣabc')).toBe('abcabc')
  })
})
