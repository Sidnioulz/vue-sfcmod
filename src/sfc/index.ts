import { NodeTypes, CompilerError, TextModes } from '@vue/compiler-core'
import * as CompilerDom from '@vue/compiler-dom'
import { LRUCache } from 'lru-cache'

import type { SFCBlock, SFCScriptBlock, SFCStyleBlock, SFCTemplateBlock } from '../types/SFCBlock'
import type { SFCDescriptor } from '../types/SFCDescriptor'
import type { SFCParseOptions } from '../types/SFCParseOptions'

import { createBlock } from './createBlock'
import { createDuplicateBlockError } from './createDuplicateBlockError'
import { generateSourceMap } from './generateSourceMap'
import { hasSrc } from './hasSrc'

/**
 * The following function is adapted from https://github.com/psalaets/vue-sfc-descriptor-to-string/blob/master/index.js
 */

/**
 * The MIT License (MIT)
 * Copyright (c) 2018 Paul Salaets
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

function makeOpenTag(block: SFCBlock) {
  let source = `<${block.type}`

  source += Object.keys(block.attrs)
    .sort()
    .map((name) => {
      const value = block.attrs[name]

      if (value === true) {
        return name
      }

      return `${name}="${value}"`
    })
    .map((attr) => ` ${attr}`)
    .join('')

  return `${source}>`
}

function makeCloseTag(block: SFCBlock) {
  return `</${block.type}>\n`
}

export function stringify(sfcDescriptor: SFCDescriptor) {
  const { template, script, scriptSetup, styles, customBlocks } = sfcDescriptor

  return (
    (
      [template, script, scriptSetup, ...styles, ...customBlocks]
        // discard blocks that don't exist
        .filter((block) => block != null) as Array<NonNullable<SFCBlock>>
    )
      // sort blocks by source position
      .sort((a, b) => a.loc.start.offset - b.loc.start.offset)
      // figure out exact source positions of blocks
      .map((block) => {
        const openTag = makeOpenTag(block)
        const closeTag = makeCloseTag(block)

        return {
          ...block,
          openTag,
          closeTag,

          startOfOpenTag: block.loc.start.offset - openTag.length,
          endOfOpenTag: block.loc.start.offset,

          startOfCloseTag: block.loc.end.offset,
          endOfCloseTag: block.loc.end.offset + closeTag.length,
        }
      })
      // generate sfc source
      .reduce((sfcCode, block, index, array) => {
        const first = index === 0

        let newlinesBefore = 0

        if (first) {
          newlinesBefore = block.startOfOpenTag
        } else {
          const prevBlock = array[index - 1]
          newlinesBefore = block.startOfOpenTag - prevBlock.endOfCloseTag
        }

        return (
          sfcCode + '\n'.repeat(newlinesBefore) + block.openTag + block.content + block.closeTag
        )
      }, '')
  )
}

/**
 * The following content are modifed from https://github.com/vuejs/vue-next/blob/master/packages/compiler-sfc/src/parse.ts
 */

export interface SFCParseResult {
  descriptor: SFCDescriptor
  errors: (CompilerError | SyntaxError)[]
}

const SFC_CACHE_MAX = 500
const SFC_CACHE_MAX_SIZE = 5000
const sourceToSFC = new LRUCache<string, SFCParseResult>({
  max: SFC_CACHE_MAX,
  maxSize: SFC_CACHE_MAX_SIZE,
  sizeCalculation(n: SFCParseResult) {
    return JSON.stringify(n).length
  },
})

export function parse(
  source: string,
  {
    sourceMap = true,
    filename = 'anonymous.vue',
    sourceRoot = '',
    pad = false,
    compiler = CompilerDom,
  }: SFCParseOptions = {},
): SFCParseResult {
  const sourceKey = source + sourceMap + filename + sourceRoot + pad + compiler.parse
  const cache = sourceToSFC.get(sourceKey)
  if (cache) {
    return cache
  }

  const descriptor: SFCDescriptor = {
    filename,
    source,
    template: null,
    script: null,
    scriptSetup: null,
    styles: [],
    customBlocks: [],
  }

  const errors: (CompilerError | SyntaxError)[] = []
  const ast = compiler.parse(source, {
    // there are no components at SFC parsing level
    isNativeTag: () => true,
    // preserve all whitespaces
    isPreTag: () => true,
    getTextMode: ({ tag, props }, parent) => {
      // all top level elements except <template> are parsed as raw text
      // containers
      if (
        (!parent && tag !== 'template') ||
        // <template lang="xxx"> should also be treated as raw text
        (tag === 'template' &&
          props.some(
            (p) =>
              p.type === NodeTypes.ATTRIBUTE &&
              p.name === 'lang' &&
              p.value &&
              p.value.content !== 'html',
          ))
      ) {
        return TextModes.RAWTEXT
      }

      return TextModes.DATA
    },
    onError: (e) => {
      errors.push(e)
    },
  })

  ast.children.forEach((node) => {
    if (node.type !== NodeTypes.ELEMENT) {
      return
    }
    if (!node.children.length && !hasSrc(node) && node.tag !== 'template') {
      return
    }
    switch (node.tag) {
      case 'template': {
        if (!descriptor.template) {
          descriptor.template = createBlock(node, source, false) as SFCTemplateBlock
          descriptor.template.ast = node
        } else {
          errors.push(createDuplicateBlockError(node))
        }
        break
      }
      case 'script': {
        const scriptBlock = createBlock(node, source, pad) as SFCScriptBlock
        const isSetup = !!scriptBlock.attrs.setup
        if (isSetup && !descriptor.scriptSetup) {
          descriptor.scriptSetup = scriptBlock
          break
        }
        if (!isSetup && !descriptor.script) {
          descriptor.script = scriptBlock
          break
        }
        errors.push(createDuplicateBlockError(node, isSetup))
        break
      }
      case 'style': {
        const styleBlock = createBlock(node, source, pad) as SFCStyleBlock
        if (styleBlock.attrs.vars) {
          errors.push(
            new SyntaxError(
              '<style vars> has been replaced by a new proposal: ' +
                'https://github.com/vuejs/rfcs/pull/231',
            ),
          )
        }
        descriptor.styles.push(styleBlock)
        break
      }
      default:
        descriptor.customBlocks.push(createBlock(node, source, pad))
        break
    }
  })

  if (descriptor.scriptSetup) {
    if (descriptor.scriptSetup.src) {
      errors.push(
        new SyntaxError(
          '<script setup> cannot use the "src" attribute because ' +
            'its syntax will be ambiguous outside of the component.',
        ),
      )
      descriptor.scriptSetup = null
    }
    if (descriptor.script && descriptor.script.src) {
      errors.push(
        new SyntaxError(
          '<script> cannot use the "src" attribute when <script setup> is ' +
            'also present because they must be processed together.',
        ),
      )
      descriptor.script = null
    }
  }

  if (sourceMap) {
    generateSourceMap(descriptor, filename, source, sourceRoot, pad)
  }

  const result = {
    descriptor,
    errors,
  }
  sourceToSFC.set(sourceKey, result)

  return result
}
