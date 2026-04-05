const ROMAN_RE = /IV|I{1,3}/g

function romanToArabic(match: string, offset: number, str: string): string {
  if (match === 'IV') return '4'
  const len = match.length
  if (len === 1) {
    const after = str[offset + 1]
    if (after && /[A-Za-z]/.test(after)) return match
  }
  return String(len)
}

export function normalizeSearch(text: string): string {
  let result = text.normalize('NFKC')
  result = result.replace(ROMAN_RE, romanToArabic)
  result = result.toLowerCase()
  result = result.replace(/[()（）\u3010\u3011\u300C\u300D\u300E\u300F\u3008\u3009\u300A\u300B\u3014\u3015<>＜＞\u2022\u30FB\u00B7\u002D\u2010\u2013\u2014\u2015\u2500\u30FC\uFF0D;;\uFF1A:~\uFF5E\u301C、，,。.!！?？=＝+|&＆ \u3000\t/]/g, '')
  return result
}
