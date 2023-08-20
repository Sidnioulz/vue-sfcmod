import type { TemplateTransformation } from '~/types/TemplateTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'
import debug from '~/utils/debug'

export default function transformTemplate(
  transformation: TemplateTransformation,
  descriptor: TransformationBlock,
  path: string,
  params: object,
): boolean {
  debug('Running template transform')

  if (transformation || descriptor || path || params) {
    // TODO
    debug('Not supported yet, no template changes')
  }

  return processTransformResult(descriptor, null)
}
