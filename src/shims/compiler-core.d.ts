/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Node as VueNode, ExpressionNode } from '@vue/compiler-core'

declare module '@vue/compiler-core' {
  interface ForNodeParams {
    element: ElementNode
    isTemplateFor: boolean
  }
  interface ForDirectiveParams {
    index?: ExpressionNode
    key?: ExpressionNode
    value?: ExpressionNode
    source: ExpressionNode
  }

  interface Node {
    sfcmodMeta?: {
      isGenerated?: boolean
      shorthand?: boolean
      forNode?: ForNodeParams
      forDirective?: ForDirectiveParams
    }
  }
}
