export type TokenKind =
  'plain' | 'comment' | 'key' | 'punct' | 'string' | 'expr' | 'flag' | 'keyword'

export interface Token {
  kind: TokenKind
  text: string
}

const KEY = /^(\s*)(-\s+)?([A-Za-z_][\w./-]*)(:)(?=\s|$)/
const DASH = /^(\s*)(-)(?=\s|$)/
const INSTRUCTION =
  /^(\s*)(FROM|ARG|ENV|RUN|COPY|ADD|WORKDIR|USER|ENTRYPOINT|CMD|EXPOSE|LABEL)(?=\s)/
const INLINE =
  /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\$?\{\{.*?\}\}|\$\{\w+\}|(?:^|\s)--[\w-]+|\b(?:true|false)\b/g
const EXPR = /\$?\{\{.*?\}\}|\$\{\w+\}/g

const commentAt = (line: string) => {
  let quote = ''
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (quote) {
      if (char === quote) quote = ''
    } else if (char === "'" || char === '"') {
      quote = char
    } else if (char === '#' && (i === 0 || /\s/.test(line[i - 1] ?? ''))) {
      return i
    }
  }
  return -1
}

const pushString = (text: string, out: Token[]) => {
  let last = 0
  for (const match of text.matchAll(EXPR)) {
    const index = match.index ?? 0
    if (index > last) out.push({ kind: 'string', text: text.slice(last, index) })
    out.push({ kind: 'expr', text: match[0] })
    last = index + match[0].length
  }
  if (last < text.length) out.push({ kind: 'string', text: text.slice(last) })
}

const pushInline = (text: string, out: Token[]) => {
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    let value = match[0]
    let index = match.index ?? 0
    if (/^\s/.test(value)) {
      value = value.slice(1)
      index += 1
    }
    if (index > last) out.push({ kind: 'plain', text: text.slice(last, index) })
    if (value.startsWith("'") || value.startsWith('"')) pushString(value, out)
    else if (value.startsWith('--')) out.push({ kind: 'flag', text: value })
    else if (value === 'true' || value === 'false') out.push({ kind: 'keyword', text: value })
    else out.push({ kind: 'expr', text: value })
    last = index + value.length
  }
  if (last < text.length) out.push({ kind: 'plain', text: text.slice(last) })
}

export const highlight = (code: string, dockerfile = false): Token[][] =>
  code.split('\n').map((line) => {
    const out: Token[] = []
    const at = commentAt(line)
    let body = at === -1 ? line : line.slice(0, at)
    const lead = KEY.exec(body) ?? (dockerfile ? INSTRUCTION.exec(body) : null) ?? DASH.exec(body)
    if (lead) {
      const [whole, indent = '', ...parts] = lead
      if (indent) out.push({ kind: 'plain', text: indent })
      if (lead.length === 5) {
        const [dash = '', name = '', colon = ''] = parts
        if (dash) out.push({ kind: 'punct', text: dash })
        out.push({ kind: 'key', text: name }, { kind: 'punct', text: colon })
      } else {
        out.push({ kind: lead[2] === '-' ? 'punct' : 'keyword', text: lead[2] ?? '' })
      }
      body = body.slice(whole.length)
    }
    pushInline(body, out)
    if (at !== -1) out.push({ kind: 'comment', text: line.slice(at) })
    return out
  })
