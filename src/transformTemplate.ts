import { compileTemplate } from '@vue/compiler-sfc'

import processTransformResult from '~/processTransformResult'
import * as TemplateAPI from '~/template/api'
import { stringify } from '~/template/stringify'
import type { TemplateTransformation } from '~/types/TemplateTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'
import debug from '~/utils/debug'
import error from '~/utils/error'

export default function transformTemplate(
  transformation: TemplateTransformation,
  descriptor: TransformationBlock,
  path: string,
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

  const out = stringify(transformation(result.ast, TemplateAPI))

  return processTransformResult(descriptor, out)
}
