import type {
  AttributeNode,
  BaseElementNode,
  DirectiveNode,
  ExpressionNode,
  ForNode,
  ForNodeParams,
  Node,
  RootNode,
  SimpleExpressionNode,
  PlainElementNode,
  TemplateNode,
  TextNode,
} from '@vue/compiler-core'
import { ElementTypes, NodeTypes } from '@vue/compiler-core'

import {
  genFakeLoc,
  isAttribute,
  isCompoundExpression,
  isDirective,
  isNode,
  isText,
} from '~/template/utils'
import { debugTemplate } from '~/utils/debug'
import error from '~/utils/error'

export {
  isNotEmpty,
  isAttribute,
  isComment,
  isCompoundExpression,
  isDirective,
  isElement,
  isFor,
  isIf,
  isIfBranch,
  isInterpolation,
  isJsProperty,
  isObjectExpression,
  isNode,
  isRoot,
  isSimpleExpression,
  isText,
  isTextCall,
  isVNodeCall,
  genFakeLoc,
  isGenerated,
} from '~/template/utils'

// TODO getParent
// TODO getParentUpTo

/* -- CREATE FUNCTIONS -- */
interface CreateSimpleExpressionOptions
  extends Omit<SimpleExpressionNode, 'loc' | 'type' | 'constType'> {}
export function createSimpleExpression({
  content,
  isStatic,
}: CreateSimpleExpressionOptions): SimpleExpressionNode {
  debugTemplate('api: Creating SimpleExpression', content)

  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc: genFakeLoc(),
    constType: 3,
    content,
    isStatic,
  }
}

interface CreateDirectiveOptions extends Partial<Omit<DirectiveNode, 'loc' | 'type'>> {
  name: DirectiveNode['name']
  shorthand?: boolean
}
export function createDirective({
  name,
  arg,
  exp,
  modifiers = [],
  shorthand,
  sfcmodMeta = undefined,
}: CreateDirectiveOptions): DirectiveNode {
  debugTemplate('api: Creating Directive', name)

  if (
    ![
      'bind',
      'pre',
      'slot',
      'cloak',
      'else',
      'once',
      'html',
      'else-if',
      'if',
      'memo',
      'on',
      'show',
      'text',
      'style',
      'class',
      'for',
    ].includes(name)
  ) {
    throw error('createDirective: Unrecognised directive name', name)
  }

  const defaultShorthand = ['slot', 'on'].includes(name)

  const wellTypedModifiers = modifiers.map((mod) => {
    if (typeof mod === 'string') {
      return createSimpleExpression({ content: mod, isStatic: true })
    }

    return mod
  })

  return {
    type: NodeTypes.DIRECTIVE,
    loc: genFakeLoc(),
    name,
    arg,
    exp,
    modifiers: wellTypedModifiers,
    sfcmodMeta: {
      ...sfcmodMeta,
      shorthand: shorthand === undefined ? defaultShorthand : shorthand,
      isGenerated: true,
    },
  }
}

export function createVCloakDirective() {
  return createDirective({ name: 'cloak' })
}

export function createVElseDirective() {
  return createDirective({ name: 'else' })
}

export function createVOnceDirective() {
  return createDirective({ name: 'once' })
}

interface CreateVIfDirectiveOptions {
  condition: ExpressionNode
}
export function createVIfDirective({ condition }: CreateVIfDirectiveOptions) {
  return createDirective({ name: 'if', exp: condition })
}
export function createVElseIfDirective({ condition }: CreateVIfDirectiveOptions) {
  return createDirective({ name: 'else-if', exp: condition })
}
export function createVShowDirective({ condition }: CreateVIfDirectiveOptions) {
  return createDirective({ name: 'show', exp: condition })
}

interface CreateMandatoryExpDirectiveOptions {
  exp: ExpressionNode
}
export function createVHTMLDirective({ exp }: CreateMandatoryExpDirectiveOptions) {
  return createDirective({ name: 'html', exp })
}
export function createVTextDirective({ exp }: CreateMandatoryExpDirectiveOptions) {
  return createDirective({ name: 'text', exp })
}

interface CreateVMemoDirectiveOptions {
  dependencies: (SimpleExpressionNode | string)[]
  // TODO: Support CompoundExpressionNode.
  // dependencies: (ExpressionNode | string)[]
}
export function createVMemoDirective({ dependencies }: CreateVMemoDirectiveOptions) {
  // TODO: Current structure for an equivalent CompoundExpressionNode.
  // children.push('[')
  // for (let i = 0; i < dependencies.length; i += 1) {
  //   if (i !== 0) {
  //     children.push(', ')
  //   }
  //   children.push(dependencies[i])
  // }
  // children.push(']')

  return createDirective({
    // TODO: create a CompoundExpressionNode once support is improved.
    name: 'memo',
    exp: createSimpleExpression({
      content: `[${dependencies
        .map((dep) => {
          return typeof dep === 'string' ? dep : dep.content
        })
        .join(', ')}]`,
      isStatic: true,
    }),
  })
}

interface CreateStyleAttrOptions {
  style: Record<string, string>
  shorthand?: boolean
}
export function createStyleAttr({ shorthand, style }: CreateStyleAttrOptions) {
  // TODO write this as a CompoundExpressionNode.
  const exp = createSimpleExpression({ isStatic: false, content: JSON.stringify(style) })
  const arg = createSimpleExpression({ isStatic: true, content: 'style' })

  return createDirective({
    name: 'bind',
    arg,
    exp,
    shorthand: shorthand || true,
  })
}

interface CreateVBindDirectiveOptions extends Omit<CreateDirectiveOptions, 'arg' | 'name'> {
  prop?: string | ExpressionNode
}
export function createVBindDirective(opts: CreateVBindDirectiveOptions) {
  const arg =
    typeof opts.prop === 'string'
      ? createSimpleExpression({ content: opts.prop, isStatic: true })
      : opts.prop

  return createDirective({
    name: 'bind',
    arg,
    exp: opts.exp,
    modifiers: opts.modifiers,
    shorthand: opts.shorthand,
  })
}

/**
 * Takes a variable that is either a string or an ExpressionNode, and
 * returns a valid ExpressionNode.
 * @param source The source to convert.
 * @param isStatic In case the source is a string, whether the returned
 * expression should be static or not (false by default).
 * @returns A SimpleExpressionNode if the source was a string, or the source otherwise.
 */
export function stringToExpression(
  source: string | ExpressionNode,
  isStatic = false,
): ExpressionNode {
  return typeof source === 'string' ? createSimpleExpression({ content: source, isStatic }) : source
}

interface CreateVForDirectiveOptions {
  index?: string | ExpressionNode
  key?: string | ExpressionNode
  source: string | ExpressionNode
  value?: string | ExpressionNode
}

export function _createVForDirective(opts: CreateVForDirectiveOptions) {
  if (
    (isNode(opts.source) && isCompoundExpression(opts.source)) ||
    (isNode(opts.index) && isCompoundExpression(opts.index)) ||
    (isNode(opts.value) && isCompoundExpression(opts.value)) ||
    (isNode(opts.key) && isCompoundExpression(opts.key))
  ) {
    throw error('_createVForDirective: CompoundExpressionNode not yet supported', opts)
  }

  const source = stringToExpression(opts.source)
  const index = opts.index ? stringToExpression(opts.index) : undefined
  const value = opts.value ? stringToExpression(opts.value) : undefined
  const key = opts.key ? stringToExpression(opts.key) : undefined

  return createDirective({
    name: 'for',
    arg: undefined,
    exp: undefined,
    sfcmodMeta: {
      forDirective: {
        source,
        index,
        value,
        key,
      },
    },
  })
}

interface CreateForOptions extends ForNodeParams, CreateVForDirectiveOptions {}
export function createFor(opts: CreateForOptions): ForNode {
  debugTemplate('api: Creating For Node', opts)
  const { element, isTemplateFor } = opts

  const source = stringToExpression(opts.source)
  const index = opts.index ? stringToExpression(opts.index) : undefined
  const value = opts.value ? stringToExpression(opts.value) : undefined
  const key = opts.key ? stringToExpression(opts.key) : undefined

  if (element.props.every((prop) => prop.name !== 'for')) {
    const forDirective = _createVForDirective({ source, key, value, index })
    element.props.push(forDirective)
  }

  return {
    type: NodeTypes.FOR,
    loc: genFakeLoc(),
    sfcmodMeta: {
      forNode: {
        element,
        isTemplateFor,
      },
    },
    source,
    valueAlias: value,
    keyAlias: key,
    objectIndexAlias: index,
    parseResult: {
      source,
      value,
      key,
      index,
      finalized: true,
    },
    children: [],
  }
}

export function createText({ content }: Omit<TextNode, 'loc' | 'type'>): TextNode {
  debugTemplate('api: Creating Text', content)

  return {
    type: NodeTypes.TEXT,
    loc: genFakeLoc(),
    content,
  }
}

interface CreatePlainElementOptions
  extends Omit<PlainElementNode, 'loc' | 'ns' | 'type' | 'children' | 'isSelfClosing' | 'props'> {
  children?: PlainElementNode['children']
  isSelfClosing?: PlainElementNode['isSelfClosing']
  props?: PlainElementNode['props']
}
export function createPlainElement(opts: CreatePlainElementOptions): PlainElementNode {
  debugTemplate('api: Creating Plain Element', opts)

  const {
    tagType,
    codegenNode,
    tag,
    isSelfClosing = !opts.children || opts.children.length === 0,
    children = [],
    props = [],
  } = opts

  return {
    type: NodeTypes.ELEMENT,
    loc: genFakeLoc(),
    tag,
    tagType,
    ns: 0,
    codegenNode,
    isSelfClosing,
    children,
    props,
  }
}

interface CreateTemplateOptions
  extends Omit<
    TemplateNode,
    'loc' | 'ns' | 'type' | 'children' | 'isSelfClosing' | 'props' | 'tagType' | 'codegenNode'
  > {
  children?: TemplateNode['children']
  isSelfClosing?: TemplateNode['isSelfClosing']
  props?: TemplateNode['props']
}
export function createTemplate(opts: CreateTemplateOptions): TemplateNode {
  debugTemplate('api: Creating Template Element', opts)

  const {
    tag,
    isSelfClosing = !opts.children || opts.children.length === 0,
    children = [],
    props = [],
  } = opts

  return {
    type: NodeTypes.ELEMENT,
    loc: genFakeLoc(),
    tag,
    tagType: ElementTypes.TEMPLATE,
    ns: 0,
    codegenNode: undefined,
    isSelfClosing,
    children,
    props,
  }
}

export function createAttribute({ name, value }: { name: string; value?: string }): AttributeNode {
  debugTemplate('api: Creating Attribute', name)

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value ? createText({ content: value }) : undefined,
    nameLoc: genFakeLoc(),
    loc: genFakeLoc(),
  }
}

/* -- COMPARE FUNCTIONS -- */
export function compareAttributeValues(a: AttributeNode['value'], b: AttributeNode['value']) {
  if (!a && !b) {
    return true
  }

  const aContent = a ? a.content : 'true'
  const bContent = b ? b.content : 'true'

  return aContent === bContent
}

/* -- AST EXPLORATION FUNCTIONS -- */
export function exploreAst(ast: RootNode, matcher: (node: Node) => boolean): Node[] {
  const nodeset = new Set<Node>()
  const queue: Node[] = [ast]

  while (queue.length) {
    const currentNode = queue.pop()
    if (currentNode) {
      if (matcher(currentNode)) {
        nodeset.add(currentNode)
      }

      if (typeof currentNode !== 'string') {
        const nextNodes: unknown[] = Object.values(currentNode)
          .filter(Boolean)
          .reduce((acc, current) => {
            if (Array.isArray(current)) {
              return [...acc, ...current]
            }

            return [...acc, current]
          }, [])

        queue.push(...nextNodes.filter(isNode))
      }
    }
  }

  return Array.from(nodeset)
}

export function findAstAttributes(ast: RootNode, matcher?: (node: Node) => boolean) {
  return exploreAst(ast, (node) => isAttribute(node) && (matcher?.(node) ?? true))
}

/* -- FIND FUNCTIONS -- */
export function findAttributes(
  node: BaseElementNode,
  { name, value }: Partial<Omit<AttributeNode, 'loc' | 'type'>>,
): AttributeNode[] {
  return node.props.filter((prop) => {
    if (!isAttribute(prop)) {
      return false
    }

    if (name !== undefined && prop.name === name) {
      return true
    }

    if (value !== undefined && compareAttributeValues(prop.value, value)) {
      return true
    }

    return false
  }) as AttributeNode[]
}

export function findDirectives(
  node: BaseElementNode,
  { name, arg, exp, modifiers }: Partial<Omit<DirectiveNode, 'loc' | 'type'>>,
): DirectiveNode[] {
  return node.props.filter((prop) => {
    if (!isDirective(prop)) {
      return false
    }

    if (name !== undefined && prop.name === name) {
      return true
    }

    if (
      modifiers !== undefined &&
      modifiers.every((mod) => prop.modifiers.every((propMod) => mod.content !== propMod.content))
    ) {
      return true
    }

    if (arg !== undefined) {
      throw error('findDirectives: TODO compareArgs', { arg, propArg: prop.arg })
    }
    if (exp !== undefined) {
      throw error('findDirectives: TODO compareExps', { exp, propExp: prop.exp })
    }

    return false
  }) as DirectiveNode[]
}

/* -- UPDATE FUNCTIONS -- */
export function updateAttribute(
  prop: AttributeNode,
  updater: (attr: AttributeNode) => Partial<Omit<AttributeNode, 'loc' | 'type'>>,
) {
  /* eslint-disable no-param-reassign */
  const changes = updater(prop)

  if (Object.hasOwn(changes, 'name')) {
    if (!changes.name) {
      throw error('updateAttribute: Invalid changes to attribute name', { prop, changes })
    }
    prop.name = changes.name
  }

  if (Object.hasOwn(changes, 'value')) {
    if (
      changes.value !== undefined &&
      typeof changes.value !== 'string' &&
      !isText(changes.value)
    ) {
      throw error('updateAttribute: Invalid changes to attribute value', { prop, changes })
    }

    if (changes.value === undefined) {
      prop.value = undefined
    } else if (isText(changes.value)) {
      prop.value = changes.value
    } else {
      prop.value = createText({ content: changes.value })
    }
  }

  prop.loc = genFakeLoc()

  /* eslint-enable no-param-reassign */
  return null
}

/* -- REMOVE FUNCTIONS -- */
export function removeAttribute(
  node: BaseElementNode,
  options: Partial<Omit<AttributeNode, 'loc' | 'type'>>,
) {
  const attributesToRemove = findAttributes(node, options)
  const filteredProps = node.props.filter(
    (prop) => !isAttribute(prop) || !attributesToRemove.includes(prop),
  )

  // eslint-disable-next-line no-param-reassign
  node.props = filteredProps
}

export function removeDirective(
  node: BaseElementNode,
  options: Partial<Omit<DirectiveNode, 'loc' | 'type'>>,
) {
  const directivesToRemove = findDirectives(node, options)
  const filteredProps = node.props.filter(
    (prop) => !isDirective(prop) || !directivesToRemove.includes(prop),
  )

  // eslint-disable-next-line no-param-reassign
  node.props = filteredProps
}
