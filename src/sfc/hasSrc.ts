import { NodeTypes, ElementNode } from '@vue/compiler-core'

export function hasSrc(node: ElementNode) {
  return node.props.some((p) => {
    if (p.type !== NodeTypes.ATTRIBUTE) {
      return false
    }

    return p.name === 'src'
  })
}
