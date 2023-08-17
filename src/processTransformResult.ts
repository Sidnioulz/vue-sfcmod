import debug from '~/debug'
import type { TransformationBlock } from '~/types/TransformationBlock'

export default function processTransformResult(
  descriptor: TransformationBlock,
  out: string | void | null | undefined,
): boolean {
  debug(`Done running ${descriptor.type} transform`)

  if (out && out !== descriptor.content) {
    debug(`Updating descriptor with outcome of ${descriptor.type} transform`)
    descriptor.content = out

    return true
  }

  debug('No template changes')

  return false
}
