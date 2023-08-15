import { Statement } from '@babel/types'
import { BindingMetadata, ElementNode, SourceLocation } from '@vue/compiler-core'
import { RawSourceMap } from 'source-map'

export interface SFCBlock {
  type: string
  content: string
  attrs: Record<string, string | true>
  loc: SourceLocation
  map?: RawSourceMap
  lang?: string
  src?: string
}

export interface SFCTemplateBlock extends SFCBlock {
  type: 'template'
  ast: ElementNode
}

export interface SFCScriptBlock extends SFCBlock {
  type: 'script'
  setup?: string | boolean
  bindings?: BindingMetadata
  scriptAst?: Statement[]
  scriptSetupAst?: Statement[]
}

export interface SFCStyleBlock extends SFCBlock {
  type: 'style'
  scoped?: boolean
  module?: string | boolean
}
