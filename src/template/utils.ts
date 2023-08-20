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
  SimpleExpressionNode,
  SourceLocation,
  RootNode,
  TextCallNode,
  TextNode,
} from '@vue/compiler-core'
import { NodeTypes } from '@vue/compiler-core'

import { debugTemplate } from '~/utils/debug'

export function clearCtx(exp: string): string {
  const nullishFnCallRe = /_ctx\.([^ ]+) && _ctx\.([^(]+)\(\.\.\.args\)/
  const matches = exp.match(nullishFnCallRe)
  if (matches && matches[1] === matches[2]) {
    return matches[1]
  }

  return exp.replace(/^_ctx\./, '')
}

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

export function isNotEmpty(str: string): boolean {
  return str !== ''
}

/* Utilities for navigating the codegenNode and comparing it to the template AST. */
export function hasSameLoc(node: Node, target: SourceLocation): boolean {
  return (
    node.loc.source === target.source &&
    node.loc.start.line === target.start.line &&
    node.loc.start.column === target.start.column &&
    node.loc.start.offset === target.start.offset &&
    node.loc.end.line === target.end.line &&
    node.loc.end.column === target.end.column &&
    node.loc.end.offset === target.end.offset
  )
}

export function embedsLoc(node: Node, target: SourceLocation): boolean {
  if (node.loc.start.line > target.start.line) {
    return false
  }

  if (node.loc.start.line === target.start.line && node.loc.start.column > target.start.column) {
    return false
  }

  if (node.loc.end.line < target.end.line) {
    return false
  }

  if (node.loc.end.line === target.end.line && node.loc.end.column < target.end.column) {
    return false
  }

  if (!node.loc.source.includes(target.source)) {
    return false
  }

  return true
}

// TODO build a cache to store the JS Expression Type of a CompoundExpressionNode
export function findJsType(target: Node, ast: RootNode) {
  if (ast.codegenNode === undefined) {
    debugTemplate(
      "findJSType: Can't find the type of a CompoundExpression if the AST has no codegenNode",
    )

    return null
  }

  const backlog: { node: Node; parent: Node | null }[] = [
    {
      node: ast.codegenNode,
      parent: null,
    },
  ]

  while (backlog.length) {
    const { node, parent } = backlog.pop()

    if (this.hasSameLoc(node, target.loc)) {
      return parent.type
    }

    if (this.embedsLoc(node, target.loc)) {
      // TODO add children, arg, exp, content, etc, etc, etc
    }
  }

  return null
}
