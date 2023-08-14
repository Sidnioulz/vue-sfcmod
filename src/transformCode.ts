import jscodeshift from 'jscodeshift'
// @ts-expect-error
import getParser from 'jscodeshift/src/getParser'

import debug from './debug'
import type { JSTransformation } from './types/JSTransformation'
import type { TransformationDescriptor } from './types/TransformationDescriptor'

export default function transformCode(
  transformation: JSTransformation,
  descriptor: TransformationDescriptor,
  path: string,
  params: object,
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
    parser =
      typeof parserOption === 'string' ? getParser(parserOption) : parserOption
  }

  const j = jscodeshift.withParser(parser)
  const api = {
    j,
    jscodeshift: j,
    stats: () => { },
    report: () => { },
  }

  const out = transformation({ path, source: descriptor.content }, api, params)
  debug('Done running jscodeshift transform')

  if (out && out !== descriptor.content) {
    debug('Updating descriptor with transformed content')
    descriptor.content = out
    return true
  }

  debug('No code changes')
  return false
}
