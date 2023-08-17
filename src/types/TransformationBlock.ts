import type { SFCBlock } from '@vue/compiler-sfc'

export interface TransformationBlock extends Omit<SFCBlock, 'loc'> {
  loc?: SFCBlock['loc']
}
