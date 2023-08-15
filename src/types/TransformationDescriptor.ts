import type { SFCBlock } from './SFCBlock'

export interface TransformationDescriptor extends Omit<SFCBlock, 'loc'> {
  loc?: SFCBlock['loc']
}
