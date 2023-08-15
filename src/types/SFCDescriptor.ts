import type { SFCBlock, SFCScriptBlock, SFCStyleBlock, SFCTemplateBlock } from './SFCBlock'

export interface SFCDescriptor {
  filename: string
  source: string
  template: SFCTemplateBlock | null
  script: SFCScriptBlock | null
  scriptSetup: SFCScriptBlock | null
  styles: SFCStyleBlock[]
  customBlocks: SFCBlock[]
}
