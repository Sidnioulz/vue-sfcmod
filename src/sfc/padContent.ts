import type { SFCBlock } from '../types/SFCBlock'
import type { SFCParseOptions } from '../types/SFCParseOptions'

const splitRE = /\r?\n/g
const replaceRE = /./g

export function padContent(content: string, block: SFCBlock, pad: SFCParseOptions['pad']): string {
  const sliced = content.slice(0, block.loc.start.offset)
  if (pad === 'space') {
    return sliced.replace(replaceRE, ' ')
  }
  const offset = sliced.split(splitRE).length
  const padChar = block.type === 'script' && !block.lang ? '//\n' : '\n'

  return Array(offset).join(padChar)
}
