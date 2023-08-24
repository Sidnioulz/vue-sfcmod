import type {
  AttributeNode,
  BlockStatement,
  CacheExpression,
  CallExpression,
  CommentNode,
  CompoundExpressionNode,
  DirectiveNode,
  ElementNode,
  ForCodegenNode,
  ForNode,
  IfBranchNode,
  IfConditionalExpression,
  IfNode,
  InterpolationNode,
  JSChildNode,
  MemoExpression,
  Node,
  SimpleExpressionNode,
  SourceLocation,
  RenderSlotCall,
  RootNode,
  TemplateChildNode,
  TextCallNode,
  TextNode,
  VNodeCall,
} from '@vue/compiler-core'

import { debugTemplate } from '~/utils/debug'

/* Utilities for navigating the codegenNode and comparing it to the template AST. */
type CodegenNode =
  | BlockStatement
  | CacheExpression
  | CallExpression
  | ForCodegenNode
  | IfConditionalExpression
  | JSChildNode
  | MemoExpression
  | RenderSlotCall
  | RootNode
  | SimpleExpressionNode
  | TemplateChildNode
  | VNodeCall

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

function getKey(loc: SourceLocation): string {
  return `s${loc.start.line}/${loc.start.column}/${loc.start.offset} e${loc.end.line}/${loc.end.column}/${loc.end.offset}`
}

interface NodeStoreEntry {
  node: CodegenNode
  parent: CodegenNode | null
}

export class NodeStore {
  private nodes: Record<string, NodeStoreEntry[]>

  private childKeys: string[]

  constructor(ast: CodegenNode, childKeys: string[]) {
    this.nodes = {}
    this.childKeys = childKeys

    const queue: NodeStoreEntry[] = [
      {
        node: ast,
        parent: null,
      },
    ]

    while (queue.length) {
      const currentEntry = queue.pop()
      if (currentEntry) {
        const { node: currentNode } = currentEntry
        if (currentNode.loc) {
          this.addNode(currentEntry)
        }

        if (typeof currentNode !== 'string') {
          const nextNodes = Object.entries(currentNode)
            .filter(([key]) => this.childKeys.includes(key))
            .map(([, value]) => value)
            .filter(Boolean)
            .reduce((acc, current) => {
              if (Array.isArray(current)) {
                return [...acc, ...current]
              }

              return [...acc, current]
            }, [])

          nextNodes.forEach((node: CodegenNode) => {
            queue.push({
              node,
              parent: currentNode,
            })
          })
        }
      }
    }

    // Remove duplicates
    Object.keys(this.nodes).forEach((key) => {
      const dedup: NodeStoreEntry[] = []

      for (const a of this.nodes[key]) {
        if (
          dedup.every((b) => {
            return a.node !== b.node || a.parent !== b.parent
          })
        ) {
          dedup.push(a)
        }
      }

      this.nodes[key] = dedup
    })
  }

  getAllNodes() {
    return this.nodes
  }

  addNode(node: NodeStoreEntry) {
    if (node.type >= 13) {
      console.log(node)
    }
    const key = getKey(node.node.loc)
    this.nodes[key] ||= []
    this.nodes[key].push(node)
  }

  getNodesByLoc(loc: SourceLocation): NodeStoreEntry[] {
    return this.nodes[getKey(loc)] || []
  }

  getNodesByKey(locKey: string): NodeStoreEntry[] | undefined {
    return this.nodes[locKey] || undefined
  }
}

export function registerExpressionNodes(ast: RootNode) {
  debugTemplate('Building the index for template and codegen AST nodes')

  // const fff = (n) => _.mapValues(n, (row) => {
  //   if (typeof row !== 'object') {
  //     return row
  //   }

  //   const newRow = row
  //   if (typeof newRow.loc === 'object') {
  //     const k = getKey(newRow.loc)
  //     newRow.loc = k
  //   }

  //   return fff(newRow)
  // })

  // console.log(JSON.stringify(fff(ast.codegenNode), null, 2))

  const store = new NodeStore(ast, [
    'content',
    'children',
    'branches',
    'condition',
    'arg',
    'exp',
    'modifiers',
    'parseResult',
    'codegenNode',
    'arguments',
    'directives',
    'elements',
    'dynamicProps',
    'source',
    'value',
    'key',
    'index',
    'valueAlias',
    'keyAlias',
    'objectIndexAlias',
    'props',
    'source',
    'tag',
  ])

  debugTemplate('Index built successfully')

  return store
}
