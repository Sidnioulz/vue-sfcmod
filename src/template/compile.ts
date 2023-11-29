import type { ElementNode, NodeTransform } from '@vue/compiler-core'
import { compileTemplate as VueCompileTemplate } from '@vue/compiler-sfc'
import type { SFCTemplateCompileResults } from '@vue/compiler-sfc'

import { createTemplate, _createVForDirective } from '~/template/api'
import { _insertProp } from '~/template/stringify'
import { isFor, isElement } from '~/template/utils'

/**
 * Harmonises ForNode nodes so that, no matter what they apply to,
 * they have a singular element callees can query, and no extraneous
 * children. Also ensures that single element has a v-for DirectiveNode
 * to simplify stringifying the AST.
 */
const transformForNode: NodeTransform = (node) => {
  /* eslint-disable no-param-reassign */
  if (isFor(node)) {
    node.sfcmodMeta = node.sfcmodMeta !== undefined ? node.sfcmodMeta : {}

    const newForDirective = _createVForDirective(node.parseResult)
    const firstChild = node.children[0]

    let element: ElementNode
    const isTemplateFor =
      node.sfcmodMeta?.forNode?.isTemplateFor ||
      firstChild === undefined ||
      !firstChild.loc.source.includes('v-for') ||
      !isElement(firstChild) ||
      // Case of v-for in v-for where the parent is a template.
      firstChild.props.some((prop) => prop.name === 'for')

    if (isTemplateFor) {
      // Template ForNodes do not apply to the first of their children. All
      // node.children are children of the template element, which is not
      // represented in the tree. So, we create an ElementNode for the
      // template and give it its children.
      // NOTE: we know we're missing the existing props for the template,
      // but they're only provided later by another directive transform,
      // so we'll monkey-patch in stringify.

      element = createTemplate({
        tag: 'template',
        props: [newForDirective],
        children: node.children,
      })
    } else {
      // ForNode usually has a singular child, which is the element iterated on.
      // We mark it as the element and tell it it has a v-for directive to render.
      element = firstChild
    }

    // Inject the metadata so users can edit the ForNode and so we can stringify it.
    node.sfcmodMeta.forNode = {
      element,
      isTemplateFor,
    }

    return () => {
      _insertProp(element, 'for', newForDirective)
      node.children = []
    }
    /* eslint-enable no-param-reassign */
  }

  return undefined
}

export function compileTemplate({
  source,
  filename,
}: {
  source: string
  filename: string
}): SFCTemplateCompileResults {
  return VueCompileTemplate({
    source,
    filename,
    id: 'fake-id',
    // TODO set inMap
    compilerOptions: {
      nodeTransforms: [transformForNode],
      comments: true,
      hoistStatic: false,
      cacheHandlers: false,
      sourceMap: true,
      // TODO, whitespace: 'preserve',
      // TODO, set slotted, see compiler-core.d.ts:836
    },
  })
}
