import jscodeshift from 'jscodeshift'
// @ts-expect-error getParser is not directly exported and thus not well typed
import getParser from 'jscodeshift/src/getParser.js'

import processTransformResult from '~/processTransformResult'
import type { JSTransformation } from '~/types/JSTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'
import type { Options } from '~/types/TransformationOptions'
import debug from '~/utils/debug'

export default function transformCode(
  transformation: JSTransformation,
  descriptor: TransformationBlock,
  path: string,
  params: Options,
): boolean {
  debug('Running jscodeshift transform')

  let parser = getParser()
  let parserOption = transformation.parser

  // force inject `parser` option for .tsx? files, unless the module specifies a custom implementation
  if (typeof parserOption !== 'object') {
    if (descriptor.lang?.startsWith('ts')) {
      parserOption = descriptor.lang
    }
  }

  if (parserOption) {
    parser = typeof parserOption === 'string' ? getParser(parserOption) : parserOption
  }

  const j = jscodeshift.withParser(parser)
  const api = {
    j,
    jscodeshift: j,
    stats: () => {
      return undefined
    },
    report: () => {
      return undefined
    },
  }

  const out = transformation({ path, source: descriptor.content }, api, params)

  return processTransformResult(descriptor, out)
}
