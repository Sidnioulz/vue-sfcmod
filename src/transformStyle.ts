import debug from '~/debug'
import type { StyleTransformation } from '~/types/StyleTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'

export default function transformStyle(
  transformation: StyleTransformation,
  descriptor: TransformationBlock,
  path: string,
  params: object,
): boolean {
  debug('Running style transform')

  if (transformation || descriptor || path || params) {
    // TODO
    debug('Not supported yet, no style changes')
  }

  return false
}
