import { compileTemplate } from '@vue/compiler-sfc'

import processTransformResult from '~/processTransformResult'
import * as TemplateAPI from '~/template/api'
import { stringify } from '~/template/stringify'
import type { TemplateTransformation } from '~/types/TemplateTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'
import type { Options } from '~/types/TransformationOptions'
import debug from '~/utils/debug'
import error from '~/utils/error'

export default function transformTemplate(
  transformation: TemplateTransformation,
  descriptor: TransformationBlock,
  path: string,
  params: Options,
): boolean {
  debug('Running template transform')

  const result = compileTemplate({
    source: descriptor.content,
    filename: path,
    id: 'fake-id',
  })

  if (!result.ast) {
    throw error(
      "transformTemplate: template could not be compiled. Are you sure it's valid Vue syntax?",
      path,
    )
  }

  const filteredAPI = { ...TemplateAPI }
  for (const key of Object.keys(filteredAPI).filter((k) => k.startsWith('_'))) {
    delete filteredAPI[key as keyof typeof filteredAPI]
  }
  const out = stringify(transformation(result.ast, filteredAPI, params))

  return processTransformResult(descriptor, out)
}
