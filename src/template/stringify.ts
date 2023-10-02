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
  ObjectExpression,
  RootNode,
  SimpleExpressionNode,
  TemplateChildNode,
  TextCallNode,
  TextNode,
} from '@vue/compiler-core'
import { NodeTypes } from '@vue/compiler-core'
import { isVoidTag } from '@vue/shared'

import { createDirective, findDirectives, removeAttribute } from '~/template/api'
import {
  clearCtx,
  genFakeLoc,
  isNotEmpty,
  isAttribute,
  isComment,
  isCompoundExpression,
  isDirective,
  isElement,
  isFor,
  isGenerated,
  isIf,
  isInterpolation,
  isObjectExpression,
  isRoot,
  isSimpleExpression,
  isText,
  isTextCall,
  isVNodeCall,
} from '~/template/utils'
import { debugTemplate } from '~/utils/debug'
import error from '~/utils/error'

export type StringifiableNode =
  | BaseElementNode
  | CommentNode
  | CompoundExpressionNode
  | IfBranchNode
  | IfNode
  | InterpolationNode
  | ForNode
  | TextCallNode
  | TextNode

class TemplateStringifier {
  private readonly ast: RootNode

  constructor(ast: RootNode) {
    this.ast = ast
  }

  /* -- ATTRIBUTES AND EXPRESSIONS -- */
  hasImports(node: SimpleExpressionNode) {
    return node.content.startsWith('_imports_') && node.constType === 3
  }

  processImports(node: SimpleExpressionNode) {
    if (!this.hasImports(node)) {
      return node.content
    }

    const importNode = this.ast.imports.find((imp) => {
      if (typeof imp.exp === 'string') {
        return imp.exp === node.content
      }

      if (isSimpleExpression(imp.exp)) {
        return imp.exp.content === node.content
      }

      throw error(
        'processImports: CompoundExpression import expressions are not supported yet',
        imp,
      )
    })

    if (importNode === undefined) {
      throw error(
        `processImports: Import in expression is not in the RootNode's imports: ${node.content}`,
        this.ast,
      )
    }

    return importNode.path
  }

  genExpression(node: ExpressionNode) {
    if (isSimpleExpression(node)) {
      if (this.hasImports(node)) {
        return this.processImports(node)
      }

      return clearCtx(node.content)
    }

    if (isCompoundExpression(node)) {
      debugTemplate(
        'genExpression: CompoundExpressionNode is not well implemented yet, currently printing the source code.',
      )

      // TODO: Identify JS expression type and exploit that
      // info in the stringifier to rebuild nodes manually.
      if (node.children) {
        // Interpolations seem to imply that " + " strings will be injected
        // in between values, so that the resulting string content for the
        // whole expression is a string concatenation. But the same pattern
        // can legitimate appear in nodes where we add two integers.
        const hasInterpolations = node.children.some(
          (child) => typeof child === 'object' && child.type === 5,
        )

        // Here we concatenate child node sources to obtain the likely
        // content of the CompoundExpressionNode.
        let likelyOutcome = node.children
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

        // Then we perform optimisations and sanitisations where
        // unlikely to have side effects.

        // For objects, we want to check if there's a chance we have the
        // { foo: foo } pattern, in which case we want to rewrite it to
        // { foo }.
        if (likelyOutcome.includes('{') && likelyOutcome.includes('}')) {
          // First remove string content to avoid matching things inside strings.
          const buffer = likelyOutcome
            .replace(/`[^`]*`/g, '')
            .replace(/"[^"]*"/g, '')
            .replace(/'[^']*'/g, '')

          // Next find patterns that must be replaced and replace them.
          const varPairings = buffer.match(/([^:{} ,]+) *: *([^:{} ,]+)/g)
          if (varPairings) {
            const changesToMake = varPairings
              .map((str) => {
                const pair = str.split(':').map((v) => v.trim())

                return {
                  str,
                  pair,
                }
              })
              .filter(({ pair }) => pair[0] === pair[1])
              .map(({ pair, str }) => ({ replacement: pair[0], str }))

            changesToMake.forEach(({ replacement, str }) => {
              likelyOutcome = likelyOutcome.replace(str, replacement)
            })
          }
        }

        return likelyOutcome
      }

      return node.loc.source
    }

    throw error('genExpression: unrecognised ExpressionNode', node)
  }

  genInterpolation(node: InterpolationNode): string {
    return `{{ ${this.genExpression(node.content)} }}`
  }

  genAttribute(prop: AttributeNode): string {
    return prop.value !== undefined ? `${prop.name}="${this.genText(prop.value)}"` : prop.name
  }

  genProps(node: BaseElementNode): string[] {
    const { props = [] } = node

    return props
      .map((prop) => {
        if (isAttribute(prop)) {
          return this.genAttribute(prop)
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
    propToInsert: AttributeNode | DirectiveNode,
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

      node.props.splice(propPositions.indexOf(`v-${operation}`), 0, propToInsert)
    } else {
      node.props.push(propToInsert)
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

          const newIfDirective = createDirective({
            name: operation,
            arg: undefined,
            exp: branch.condition,
            modifiers: [],
          })

          const firstChild = branch.children[0]
          if (branch.isTemplateIf) {
            const extraProps: string[] = [this.genDirective(newIfDirective)]

            if (branch.userKey) {
              extraProps.push(
                isAttribute(branch.userKey)
                  ? this.genAttribute(branch.userKey)
                  : this.genDirective(branch.userKey),
              )
            }

            return `<template ${extraProps.join(' ')}>${this.genChildren(
              branch.children,
            )}</template>`
          }

          if (!isElement(firstChild)) {
            throw error(
              `genIf: attempting to render a branch child that's not yet supported (type ${firstChild.type})`,
              branch,
            )
          }

          this.insertProp(firstChild, operation, newIfDirective)

          return this.genChildren(branch.children)
        }

        throw error('genIf: IfNode children should be IfBranchNode instances', branch)
      })
      .filter(isNotEmpty)
      .join('\n')
  }

  genObjectExpressionProperties(props: ObjectExpression): string[] {
    const extraProps: string[] = []

    props.properties.forEach((prop) => {
      if (isSimpleExpression(prop.value) || isCompoundExpression(prop.value)) {
        extraProps.push(`:${this.genExpression(prop.key)}="${this.genExpression(prop.value)}"`)
      } else {
        throw error(
          `genObjectExpressionProperties: prop value type ${prop.value.type} is not supported yet`,
          prop,
        )
      }
    })

    return extraProps
  }

  genFor(node: ForNode): string {
    if (!node.sfcmodMeta?.forNode) {
      throw error('genFor: Missing sfcmod metadata', node)
    }
    const template = node.sfcmodMeta.forNode.element

    if (node.sfcmodMeta.forNode.isTemplateFor) {
      const props: Array<AttributeNode | DirectiveNode> = []
      const returns = node.codegenNode?.children.arguments[1]?.returns
      if (returns && isVNodeCall(returns) && returns.props && isObjectExpression(returns.props)) {
        returns.props.properties.forEach((prop) => {
          if (isSimpleExpression(prop.value) || isCompoundExpression(prop.value)) {
            props.push(
              createDirective({
                name: 'bind',
                arg: prop.key,
                exp: prop.value,
                shorthand: true,
              }),
            )
          } else {
            throw error(`genFor: prop value type ${prop.value.type} is not supported yet`, node)
          }
        })
      }
      // This odd manipulation is done because the codegenNode loc contains more clues
      // as to the position of each prop. It can fail gracefully as the only consequence
      // would be the for directive to not be ordered correctly.
      const vForProp = template.props[0]
      const copyNode: BaseElementNode = {
        ...template,
        loc: node.codegenNode?.loc || template.loc,
        props,
      }
      this.insertProp(copyNode, 'for', vForProp)
      template.props = copyNode.props
    }

    return this.genElement(template)
  }

  /* -- DIRECTIVES -- */
  genDirectivePrefix(prop: DirectiveNode): string {
    // Here, we must handle an edge case where the Vue compiler mistakenly
    // transforms perfectly fine attributes like src="http://foo" to directives
    // and points their value to an "imports" expression on the RootNode.
    // If the expression points to an import, we return no prefix so the
    // stringification is correct.
    if (prop.exp && isSimpleExpression(prop.exp) && this.hasImports(prop.exp)) {
      return ''
    }

    const shorthand =
      {
        slot: '#',
        on: '@',
      }[prop.name] || ':'

    const full = `v-${prop.name}`

    if (isGenerated(prop)) {
      return prop.sfcmodMeta?.shorthand ? shorthand : full
    }

    return prop.loc.source.includes(full) ? full : shorthand
  }

  genDirective(prop: DirectiveNode): string {
    // exp-less and arg-less directives, including `pre` only for generated nodes.
    if (['cloak', 'else', 'once', 'pre'].includes(prop.name)) {
      return `v-${prop.name}`
    }

    // arg-less directives
    if (['else-if', 'html', 'if', 'memo', 'show', 'text'].includes(prop.name)) {
      if (prop.exp === undefined) {
        throw error(`genDirective: ${prop.name} directive has no exp`, prop)
      }

      return `v-${prop.name}="${this.genExpression(prop.exp)}"`
    }

    if (prop.name === 'for') {
      const meta = prop?.sfcmodMeta?.forDirective ?? prop.forParseResult
      if (!meta) {
        throw error(
          "genDirective: 'for' directive must have a sfcmodMeta.forDirective object or a well-defined parseResult",
          prop,
        )
      }

      const source = this.genExpression(meta.source)
      const value = meta.value ? this.genExpression(meta.value) : undefined
      const key = meta.key ? this.genExpression(meta.key) : undefined
      const index = meta.index ? this.genExpression(meta.index) : undefined
      const definedExpressions = [value, key, index].filter(Boolean)

      const attrLHS =
        definedExpressions.length > 1 ? `(${definedExpressions.join(', ')})` : definedExpressions[0]

      return `v-for="${attrLHS} in ${source}"`
    }

    // Generic handling of directives with optional arg, exp, modifiers, shorthand.
    let lhs = this.genDirectivePrefix(prop)
    let argName = ''

    if (prop.arg && isSimpleExpression(prop.arg)) {
      argName = prop.arg.isStatic ? `${prop.arg.content}` : `[${this.genExpression(prop.arg)}]`
    }
    if (prop.arg && isCompoundExpression(prop.arg)) {
      const argContent = this.genExpression(prop.arg)
      if (
        ["'", '"', '`'].some((delim) => argContent.startsWith(delim) && argContent.endsWith(delim))
      ) {
        argName = `[${argContent}]`
      } else {
        argName = argContent
      }
    }

    // If not using the shorthand, we must separate prefix and arg with semicolon.
    if (argName.length && lhs.length > 1) {
      lhs = `${lhs}:`
    }
    const modifiers = prop.modifiers.map((m) => `.${m.content}`).join('')
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

    return `\n${children.map((child) => this.genNode(child)).join('\n')}\n`
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
    return `<!--${node.content}-->`
  }

  genNode(node: StringifiableNode): string {
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

    if (tag === 'transition') {
      const hasVShowDirectChild = node.children.some(
        (child) =>
          isElement(child) &&
          findDirectives(child, {
            name: 'v-show',
          }),
      )
      if (hasVShowDirectChild) {
        removeAttribute(node, {
          name: 'persisted',
        })
      }
    }

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

let stringifyNodeInstance: TemplateStringifier
function initNodeInstance() {
  if (!stringifyNodeInstance) {
    stringifyNodeInstance = new TemplateStringifier({
      type: NodeTypes.ROOT,
      children: [],
      helpers: new Set(),
      components: [],
      directives: [],
      hoists: [],
      imports: [],
      cached: 0,
      temps: 0,
      loc: genFakeLoc(),
    })
  }
}

export function stringifyNode(node: StringifiableNode) {
  initNodeInstance()

  return stringifyNodeInstance.genNode(node)
}

export function _insertProp(
  node: BaseElementNode,
  operation: string,
  prop: AttributeNode | DirectiveNode,
) {
  initNodeInstance()
  stringifyNodeInstance.insertProp(node, operation, prop)
}
