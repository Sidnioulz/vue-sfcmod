import debug from './debug'
import type { TemplateTransformation } from './types/TemplateTransformation'
import type { TransformationDescriptor } from './types/TransformationDescriptor'

export default function transformTemplate(
  transformation: TemplateTransformation,
  descriptor: TransformationDescriptor,
  path: string,
  params: object,
): boolean {
  debug('Running template transform')
  // TODO
  debug('Not supported yet, no template changes')
  return false
}
