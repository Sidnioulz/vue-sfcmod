import processTransformResult from '~/processTransformResult'
import type { StyleTransformation } from '~/types/StyleTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'
import debug from '~/utils/debug'

export default function transformStyle(
  transformation: StyleTransformation,
  descriptor: TransformationBlock,
  // path: string,
  // params: object,
): boolean {
  debug('Running style transform')

  // TODO
  if (transformation) {
    debug('Not supported yet, no style changes')
  }
  // TODO
  const out = descriptor.content

  return processTransformResult(descriptor, out)
}
