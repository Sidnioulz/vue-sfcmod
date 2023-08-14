import debug from './debug'
import type { StyleTransformation } from './types/StyleTransformation'
import type { TransformationDescriptor } from './types/TransformationDescriptor'

export default function transformStyle(
  transformation: StyleTransformation,
  descriptor: TransformationDescriptor,
  path: string,
  params: object,
): boolean {
  debug('Running style transform')
  // TODO
  debug('Not supported yet, no style changes')
  return false
}
