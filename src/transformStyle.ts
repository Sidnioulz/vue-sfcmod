import postcss, { AtRule, Declaration, Root, Rule } from 'postcss'
import postcssLess from 'postcss-less'
import postcssScss from 'postcss-scss'

import processTransformResult from '~/processTransformResult'
import type { StyleTransformation, StyleTransformationContext } from '~/types/StyleTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'
import type { Options } from '~/types/TransformationOptions'
import debug from '~/utils/debug'

function getParser(lang?: string) {
  switch (lang) {
    case 'scss':
    case 'sass':
      return postcssScss
    case 'less':
      return postcssLess
    case 'css':
    default:
      return undefined
  }
}

export default function transformStyle(
  transformation: StyleTransformation,
  descriptor: TransformationBlock,
  path: string,
  params: Options,
): boolean {
  debug('Running PostCSS style transform')

  if (!transformation) {
    debug('No transformation provided')

    return false
  }

  const parser = getParser(descriptor.lang)
  const processor = postcss()

  try {
    // Parse the CSS content
    const result = processor.process(descriptor.content, {
      from: path,
      parser,
    })

    // Create context object similar to JSCodeshift API
    const context: StyleTransformationContext = {
      root: result.root as Root,
      result,
      processor,
      postcss: {
        AtRule,
        Declaration,
        Root,
        Rule,
      },
    }

    // Execute the transformation
    const transformResult = transformation({ path, source: descriptor.content }, context, params)

    let output: string

    if (typeof transformResult === 'string') {
      // If transformation returns a string, use it directly
      output = transformResult
    } else if (
      transformResult &&
      typeof transformResult === 'object' &&
      'toString' in transformResult
    ) {
      // If transformation returns a PostCSS Root, stringify it
      output = transformResult.toString()
    } else if (transformResult === undefined || transformResult === null) {
      // If transformation returns void/null, use the modified root
      output = result.root.toString()
    } else {
      debug('Unexpected transformation result type:', typeof transformResult)
      output = result.root.toString()
    }

    return processTransformResult(descriptor, output)
  } catch (error) {
    debug('Error during CSS transformation:', error)
    throw error
  }
}
