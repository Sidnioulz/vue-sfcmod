import type { SFCBlock } from '../sfcUtils'

export interface TransformationDescriptor extends Omit<SFCBlock, 'loc'> {
  loc?: SFCBlock['loc']
}
