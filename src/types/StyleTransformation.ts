import type { AtRule, Declaration, LazyResult, Processor, Root, Rule } from 'postcss'

import type { Options } from './TransformationOptions'

export type StyleTransformationFileInfo = {
  path: string
  source: string
}

export type StyleTransformationContext = {
  root: Root
  result: LazyResult
  processor: Processor
  postcss: {
    AtRule: typeof AtRule
    Declaration: typeof Declaration
    Root: typeof Root
    Rule: typeof Rule
  }
}

export type StyleTransformation = (
  fileInfo: StyleTransformationFileInfo,
  context: StyleTransformationContext,
  options?: Options,
) => string | Root | void
