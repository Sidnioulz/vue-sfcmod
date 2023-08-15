import { CompilerOptions, CodegenResult, ParserOptions, RootNode } from '@vue/compiler-core'

export interface TemplateCompiler {
  compile(template: string, options: CompilerOptions): CodegenResult
  parse(template: string, options: ParserOptions): RootNode
}

export interface SFCParseOptions {
  filename?: string
  sourceMap?: boolean
  sourceRoot?: string
  pad?: boolean | 'line' | 'space'
  compiler?: TemplateCompiler
}
