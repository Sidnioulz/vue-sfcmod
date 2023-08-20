import type { JSTransformation } from '~/types/JSTransformation'
import type { TransformationModule } from '~/types/TransformationModule'
import type { VueTransformation } from '~/types/VueTransformation'
import debug from '~/utils/debug'
import { isVueTransformation } from '~/utils/isVueTransformation'

export function normaliseTransformationModule(
  transformationModule: TransformationModule,
): VueTransformation {
  debug('Normalising transformation module')

  let transformation: VueTransformation | JSTransformation
  if ('default' in transformationModule) {
    debug('Using default export from transformation module')
    transformation = transformationModule.default
  } else {
    debug('Using transformation module as is')
    transformation = transformationModule
  }

  if (isVueTransformation(transformation)) {
    debug('Returning VueTransformation object')

    return transformation
  }
  debug('Normalising JSTransformation to VueTransformation object')

  return { script: transformation }
}
