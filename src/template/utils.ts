import type {
  AttributeNode,
  CommentNode,
  CompoundExpressionNode,
  DirectiveNode,
  ElementNode,
  ForNode,
  IfBranchNode,
  IfNode,
  InterpolationNode,
  Node,
  ObjectExpression,
  Property,
  SimpleExpressionNode,
  RootNode,
  TextCallNode,
  TextNode,
  VNodeCall,
} from '@vue/compiler-core'
import { NodeTypes } from '@vue/compiler-core'

/* Data sanitisation. */
export function clearCtx(exp: string): string {
  const nullishFnCallRe = /_ctx\.([^ ]+) && _ctx\.([^(]+)\(\.\.\.args\)/
  const matches = exp.match(nullishFnCallRe)
  if (matches && matches[1] === matches[2]) {
    return matches[1]
  }

  return exp.replace(/^_ctx\./, '')
}
export function isNotEmpty(str: string): boolean {
  return str !== ''
}

/* Type checkers. */
export function isAttribute(prop: Node): prop is AttributeNode {
  return prop.type === NodeTypes.ATTRIBUTE
}
export function isComment(node: Node): node is CommentNode {
  return node.type === NodeTypes.COMMENT
}
export function isCompoundExpression(node: Node): node is CompoundExpressionNode {
  return node.type === NodeTypes.COMPOUND_EXPRESSION
}
export function isDirective(prop: Node): prop is DirectiveNode {
  return prop.type === NodeTypes.DIRECTIVE
}
export function isElement(node: Node): node is ElementNode {
  return node.type === NodeTypes.ELEMENT
}
export function isFor(prop: Node): prop is ForNode {
  return prop.type === NodeTypes.FOR
}
export function isIf(prop: Node): prop is IfNode {
  return prop.type === NodeTypes.IF
}
export function isIfBranch(prop: Node): prop is IfBranchNode {
  return prop.type === NodeTypes.IF_BRANCH
}
export function isInterpolation(node: Node): node is InterpolationNode {
  return node.type === NodeTypes.INTERPOLATION
}
export function isJsProperty(node: Node): node is Property {
  return node.type === NodeTypes.JS_PROPERTY
}
export function isObjectExpression(node: Node): node is ObjectExpression {
  return node.type === NodeTypes.JS_OBJECT_EXPRESSION
}
export function isRoot(node: Node): node is RootNode {
  return node.type === NodeTypes.ROOT
}
export function isSimpleExpression(node: Node): node is SimpleExpressionNode {
  return node.type === NodeTypes.SIMPLE_EXPRESSION
}
export function isText(node: Node): node is TextNode {
  return node.type === NodeTypes.TEXT
}
export function isTextCall(node: Node): node is TextCallNode {
  return node.type === NodeTypes.TEXT_CALL
}
export function isVNodeCall(node: Node): node is VNodeCall {
  return node.type === NodeTypes.VNODE_CALL
}
