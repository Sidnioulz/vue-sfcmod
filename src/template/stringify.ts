import type {
  AttributeNode,
  BaseElementNode,
  CommentNode,
  CompoundExpressionNode,
  DirectiveNode,
  ExpressionNode,
  ForNode,
  IfBranchNode,
  IfNode,
  InterpolationNode,
  RootNode,
  TemplateChildNode,
  TextCallNode,
  TextNode,
} from '@vue/compiler-core'
import { NodeTypes } from '@vue/compiler-core'
import { isVoidTag } from '@vue/shared'

import { createAttribute, createDirective, isGenerated } from '~/template/api'
import { registerExpressionNodes } from '~/template/codegen'
import {
  clearCtx,
  isNotEmpty,
  isAttribute,
  isComment,
  isCompoundExpression,
  isDirective,
  isElement,
  isFor,
  isIf,
  isInterpolation,
  isRoot,
  isSimpleExpression,
  isText,
  isTextCall,
} from '~/template/utils'
import { debugTemplate } from '~/utils/debug'
import error from '~/utils/error'

class TemplateStringifier {
  private readonly ast: RootNode

  constructor(ast: RootNode) {
    this.ast = ast
    registerExpressionNodes(ast)
  }

  /* -- ATTRIBUTES AND EXPRESSIONS -- */
  genExpression(node: ExpressionNode) {
    if (isSimpleExpression(node)) {
      return clearCtx(node.content)
    }

    if (isCompoundExpression(node)) {
      debugTemplate('genExpression: Not implemented yet, currently printing the source code.')

      // TODO: Identify JS expression type and exploit that
      // info in the stringifier to rebuild nodes manually.
      if (node.children) {
        const hasInterpolations = node.children.some(
          (child) => typeof child === 'object' && child.type === 5,
        )

        return node.children
          .map((c) => {
            if (typeof c === 'string') {
              return c
            }
            if (typeof c === 'symbol') {
              return c.description
            }

            return c.loc.source
          })
          .filter((child) => (hasInterpolations ? child !== ' + ' : true))
          .join('')
      }

      return node.loc.source
    }

    throw error('genExpression: unrecognised ExpressionNode', node)
  }

  genInterpolation(node: InterpolationNode): string {
    return `{{ ${this.genExpression(node.content)} }}`
  }

  genProps(node: BaseElementNode): string[] {
    const { props = [] } = node

    return props
      .map((prop) => {
        if (isAttribute(prop)) {
          return prop.value !== undefined ? `${prop.name}="${this.genText(prop.value)}"` : prop.name
        }

        if (isDirective(prop)) {
          return this.genDirective(prop)
        }

        throw error(
          'genProps: prop found that was neither an AttributeNode nor a DirectiveNode',
          prop,
        )
      })
      .filter(isNotEmpty)
  }

  /* -- CONDITIONALS -- */
  insertProp(
    node: BaseElementNode,
    operation: string,
    directive: AttributeNode | DirectiveNode,
  ): void {
    if (!isGenerated(node)) {
      // Sort props in the source code so we know where to place v-if / v-else to minimise disturbance.
      const propPositions = [...this.genProps(node), `v-${operation}`]
        .map((prop) => prop.split('=')[0])
        .map((arg) => ({
          arg,
          pos: node.loc.source.indexOf(arg),
        }))
        .sort((a, b) => a.pos - b.pos)
        .map(({ arg }) => arg)

      node.props.splice(propPositions.indexOf(`v-${operation}`), 0, directive)
    } else {
      node.props.push(directive)
    }
  }

  genIf(node: IfNode): string {
    return node.branches
      .map((branch, index) => {
        let operation: 'if' | 'else' | 'else-if'
        if (!branch.condition) {
          operation = 'else'
        } else {
          operation = index === 0 ? 'if' : 'else-if'
        }

        if (branch.type === NodeTypes.IF_BRANCH) {
          if (branch.children === undefined || !branch.children.length) {
            throw error('genIf: found branch without children', branch)
          }

          const firstChild = branch.children[0]
          if (!isElement(firstChild)) {
            throw error(
              `genIf: attempting to render a branch child that's not yet supported (type ${firstChild.type})`,
              branch,
            )
          }

          const newIfDirective = createDirective({
            name: operation,
            arg: undefined,
            exp: branch.condition,
            modifiers: [],
          })
          this.insertProp(firstChild, operation, newIfDirective)

          return this.genChildren(branch.children)
        }

        throw error('genIf: IfNode children should be IfBranchNode instances', branch)
      })
      .filter(isNotEmpty)
      .join('\n')
  }

  genFor(node: ForNode): string {
    if (node.children.length !== 1) {
      throw error(`genFor: unexpected children length ${node.children.length}, should be 1`, node)
    }

    const firstChild = node.children[0]
    if (!isElement(firstChild)) {
      throw error(
        `genFor: attempting to render a child that's not yet supported (type ${firstChild.type})`,
        node,
      )
    }

    const { parseResult } = node
    // We generate expressions for all components.
    const source = this.genExpression(parseResult.source)
    const value = parseResult.value ? this.genExpression(parseResult.value) : undefined
    const key = parseResult.key ? this.genExpression(parseResult.key) : undefined
    const index = parseResult.index ? this.genExpression(parseResult.index) : undefined
    const definedExpressions = [value, key, index].filter(Boolean)

    const attrLHS =
      definedExpressions.length > 1 ? `(${definedExpressions.join(', ')})` : definedExpressions[0]

    const newForDirective = createAttribute({ name: 'v-for', value: `${attrLHS} in ${source}` })
    this.insertProp(firstChild, 'for', newForDirective)

    return this.genChildren(node.children)
  }

  /* -- DIRECTIVES -- */
  genDirectivePrefix(prop: DirectiveNode): string {
    const shorthand =
      {
        slot: '#',
        on: '@',
      }[prop.name] || ':'

    const full = `v-${prop.name}`

    return `${prop.loc.source.includes(full) ? full : shorthand}`
  }

  genDirective(prop: DirectiveNode): string {
    // exp-less and arg-less directives
    if (['cloak', 'else', 'once'].includes(prop.name)) {
      return `v-${prop.name}`
    }

    // arg-less directives
    if (['else', 'else-if', 'html', 'if', 'memo', 'show', 'text'].includes(prop.name)) {
      if (prop.exp === undefined) {
        throw error(`genDirective: ${prop.name} directive has no exp`, prop)
      }

      return `v-${prop.name}="${this.genExpression(prop.exp)}"`
    }

    // Generic handling of directives with optional arg, exp, modifiers, shorthand.
    let lhs = this.genDirectivePrefix(prop)
    let argName = ''

    if (prop.arg && isSimpleExpression(prop.arg)) {
      argName = prop.arg.isStatic ? `${prop.arg.content}` : `[${this.genExpression(prop.arg)}]`
    }
    // If not using the shorthand, we must separate prefix and arg with semicolon.
    if (argName.length && lhs.length > 1) {
      lhs = `${lhs}:`
    }
    const modifiers = prop.modifiers.map((m) => `.${m}`).join('')
    const rhs = prop.exp ? `="${this.genExpression(prop.exp)}"` : ''

    return `${lhs}${argName}${modifiers}${rhs}`
  }

  genVPre(node: BaseElementNode): string[] {
    const openingTagProps = node.loc.source
      .replace(`<${node.tag}`, '')
      .replace(/>.*/, '')
      .replace(/="[^"]*"/g, '')
      .split(' ')

    return openingTagProps.includes('v-pre') ? ['v-pre'] : []
  }

  /* -- NODES -- */
  genTag(node: BaseElementNode): string {
    if (!node.tag) {
      throw error('genTag: no tag found', node)
    }

    return node.tag
  }

  genChildren(children: TemplateChildNode[]): string {
    if (!children || !children.length) {
      return ''
    }

    return children.map((child) => this.genNode(child)).join('')
  }

  genRoot(node: RootNode): string {
    if (!isRoot(node)) {
      throw error('genRoot: node is not a root', node)
    }

    return this.genChildren(node.children)
  }

  genText(node: TextNode): string {
    const content = node.content || ''
    if (content.trim().startsWith('//')) {
      return `${content}\n`
    }

    return content
  }

  genTextCall(node: TextCallNode): string {
    return this.genNode(node.content)
  }

  genComment(node: CommentNode): string {
    throw error('genComment: TODO, not implemented', node)
  }

  genNode(
    node:
      | BaseElementNode
      | CommentNode
      | CompoundExpressionNode
      | IfBranchNode
      | IfNode
      | InterpolationNode
      | ForNode
      | TextCallNode
      | TextNode,
  ): string {
    if (typeof node === 'string') {
      return node
    }
    if (isText(node)) {
      return this.genText(node)
    }
    if (isTextCall(node)) {
      return this.genTextCall(node)
    }
    if (isComment(node)) {
      return this.genComment(node)
    }
    if (isElement(node)) {
      return this.genElement(node)
    }
    if (isInterpolation(node)) {
      return this.genInterpolation(node)
    }
    if (isIf(node)) {
      return this.genIf(node)
    }
    if (isFor(node)) {
      return this.genFor(node)
    }
    if (isCompoundExpression(node) || isSimpleExpression(node)) {
      return this.genExpression(node)
    }
    if (!node) {
      debugTemplate('genNode: nullish node found')

      return ''
    }

    throw error('genNode: encountered unknown node/element', node)
  }

  genElement(node: BaseElementNode): string {
    const tag = this.genTag(node)
    const childNodes = this.genChildren(node.children)

    const directives = [this.genVPre(node), this.genProps(node)].flat().filter(isNotEmpty)

    const isVoid = isVoidTag(tag) || node.isSelfClosing
    const startTag = `<${[tag, ...directives].join(' ')}${isVoid ? ' />' : '>'}`
    const endTag = isVoid ? '' : `</${tag}>`

    return [startTag, childNodes, endTag].join('')
  }

  stringify() {
    return this.genRoot(this.ast)
  }
}

export function stringify(ast: RootNode) {
  return new TemplateStringifier(ast).stringify()
}
