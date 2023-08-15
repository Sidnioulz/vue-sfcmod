import { NodeTypes, ElementNode } from '@vue/compiler-core'

import type { SFCBlock, SFCStyleBlock, SFCScriptBlock } from '../types/SFCBlock'
import type { SFCParseOptions } from '../types/SFCParseOptions'

import { padContent } from './padContent'

export function createBlock(
  node: ElementNode,
  source: string,
  pad: SFCParseOptions['pad'],
): SFCBlock {
  const type = node.tag
  let { start, end } = node.loc
  let content = ''
  if (node.children.length) {
    start = node.children[0].loc.start
    end = node.children[node.children.length - 1].loc.end
    content = source.slice(start.offset, end.offset)
  }
  const loc = {
    source: content,
    start,
    end,
  }
  const attrs: Record<string, string | true> = {}
  const block: SFCBlock = {
    type,
    content,
    loc,
    attrs,
  }
  if (pad) {
    block.content = padContent(source, block, pad) + block.content
  }
  node.props.forEach((p) => {
    if (p.type === NodeTypes.ATTRIBUTE) {
      attrs[p.name] = p.value ? p.value.content || true : true
      if (p.name === 'lang') {
        block.lang = p.value && p.value.content
      } else if (p.name === 'src') {
        block.src = p.value && p.value.content
      } else if (type === 'style') {
        if (p.name === 'scoped') {
          ;(block as SFCStyleBlock).scoped = true
        } else if (p.name === 'module') {
          ;(block as SFCStyleBlock).module = attrs[p.name]
        }
      } else if (type === 'script' && p.name === 'setup') {
        ;(block as SFCScriptBlock).setup = attrs.setup
      }
    }
  })

  return block
}
