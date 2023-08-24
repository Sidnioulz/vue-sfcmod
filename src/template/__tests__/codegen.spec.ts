import { compileTemplate } from '@vue/compiler-sfc'

import { html } from '../../utils/html'
import { registerExpressionNodes } from '../codegen'

function prepare(source: string) {
  const result = compileTemplate({
    source,
    filename: 'unit-test.vue',
    id: 'fake-id',
  })

  return registerExpressionNodes(result.ast)
}

const SAMPLE_ONE = html`<div>
  <h3 :aria-label="props.ariaLabel">{{ props.title }}</h3>
  <ul>
    <li v-for="item in list" ref="itemRefs">{{ item }}</li>
  </ul>
  <div></div>
</div>`

const SAMPLE_ONE_OUTPUT = {
  ROOT_NODE: {
    type: 0,
    loc: {
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
      end: {
        column: 7,
        line: 7,
        offset: 160,
      },
    },
  },
  ROOT_DIV: {
    type: 1,
    ns: 0,
    tag: 'div',
    tagType: 0,
    loc: {
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
      end: {
        column: 7,
        line: 7,
        offset: 160,
      },
    },
  },
}

const SAMPLE_TWO = html`<input type="text" name="a" /><input type="text" name="b" />`

const SAMPLE_TWO_OUTPUT = {
  ROOT_NODE: {
    type: 0,
    loc: {
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
      end: {
        column: 61,
        line: 1,
        offset: 60,
      },
    },
  },
  INPUT_A: {
    type: 1,
    ns: 0,
    tag: 'input',
    tagType: 0,
    loc: {
      start: {
        column: 1,
        line: 1,
        offset: 0,
      },
      end: {
        column: 31,
        line: 1,
        offset: 30,
      },
    },
  },
  INPUT_B: {
    type: 1,
    ns: 0,
    tag: 'input',
    tagType: 0,
    loc: {
      start: {
        column: 31,
        line: 1,
        offset: 30,
      },
      end: {
        column: 61,
        line: 1,
        offset: 60,
      },
    },
  },
}

describe('template', () => {
  describe('codegen', () => {
    const storesOne = prepare(SAMPLE_ONE)
    const storesTwo = prepare(SAMPLE_TWO)

    test('returns two stores', () => {
      expect(storesOne).toBeDefined()
      expect(storesOne).toHaveProperty('codegen')
      expect(storesOne).toHaveProperty('template')
    })

    test('indexes the root node with the root HTMLElement', () => {
      expect(storesOne.getAllNodes()).toMatchObject({
        's1/1/0 e7/7/160': [
          {
            node: SAMPLE_ONE_OUTPUT.ROOT_NODE,
            parent: null,
          },
          {
            node: SAMPLE_ONE_OUTPUT.ROOT_DIV,
            parent: SAMPLE_ONE_OUTPUT.ROOT_NODE,
          },
        ],
      })
    })

    test('handles multi-root templates', () => {
      expect(storesTwo.getAllNodes()).toMatchObject({
        's1/1/0 e1/61/60': [
          {
            node: SAMPLE_TWO_OUTPUT.ROOT_NODE,
            parent: null,
          },
        ],
        's1/31/30 e1/61/60': [
          {
            node: SAMPLE_TWO_OUTPUT.INPUT_B,
            parent: SAMPLE_TWO_OUTPUT.ROOT_NODE,
          },
        ],
        's1/1/0 e1/31/30': [
          {
            node: SAMPLE_TWO_OUTPUT.INPUT_A,
            parent: SAMPLE_TWO_OUTPUT.ROOT_NODE,
          },
        ],
      })
    })

    test.todo(
      'has template nodes for all codegen nodes',
      // () => {
      //   const codegenKeys = Object.keys(storesOne.getAllNodes())
      //   for (const key of codegenKeys) {
      //     expect(storesOne.getAllNodes()).toHaveProperty(key)
      //   }
      // }
    )

    test.only('finds the codegen node for a template CompoundExpressionNode', () => {
      const compoundKey = 's2/40/45 e2/51/56'
      const nodes = storesOne.getNodesByKey(compoundKey)

      console.log(
        storesOne.getNodesByKey(compoundKey).map((n) => `${n.node.type} < ${n.parent.type}`),
      )

      console.log(nodes[0].node.codegenNode)
      console.log(nodes[0].parent.codegenNode)

      // Sanity check, adjust the key to a new CompoundExpression of this fails.
      expect(nodes.length).toBe(1)
      expect(nodes[0].node.type).toBe(8)
    })
  })
})
