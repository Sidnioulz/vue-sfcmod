import type { DirectiveNode } from '@vue/compiler-core'
import { NodeTypes } from '@vue/compiler-core'
import { compileTemplate } from '@vue/compiler-sfc'

import SampleOne from '../../__fixtures__/One'
import * as api from '../api'
import { stringifyNode } from '../stringify'
import { genFakeLoc } from '../utils'

function prepare(source: string) {
  return compileTemplate({
    source,
    filename: 'unit-test.vue',
    id: 'fake-id',
  }).ast
}

function expectStringifiedPrivate(stringifier, outcome: string): void {
  expect(stringifyNode(stringifier())).toEqual(outcome)
}

function expectStringifiedDirective(node: DirectiveNode, outcome: string): void {
  expectStringifiedPrivate(() => {
    return {
      type: NodeTypes.ELEMENT,
      isSelfClosing: true,
      tag: 'foo',
      tagType: 1,
      ns: 0,
      children: 0,
      props: [node],
      loc: genFakeLoc(),
    }
  }, `<foo ${outcome} />`)
}

describe('template', () => {
  describe('api', () => {
    describe('isGenerated', () => {
      it('returns false for the AST root', () => {
        const ast = prepare(SampleOne)
        expect(api.isGenerated(ast)).toBe(false)
        api.createText({ content: 'test' })
      })

      it('returns false for any element in a generated AST', () => {
        const ast = prepare(SampleOne)
        const allNodes = api.exploreAst(ast, () => true)
        const generatedNodes = allNodes.filter(api.isGenerated)

        expect(generatedNodes).toHaveLength(0)
      })

      it('returns true for a generated TextNode', () => {
        const newText = api.createText({ content: 'test' })
        expect(api.isGenerated(newText)).toBe(true)
      })
    })

    describe('createDirective', () => {
      it('creates a DirectiveNode with the right type and name', () => {
        const name = 'pre'
        const newDirective = api.createDirective({ name })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', name)
        expectStringifiedDirective(newDirective, 'v-pre')
      })

      it('only accepts known names', () => {
        expect(() => api.createDirective({ name: 'nonExistantDirective' })).toThrow()
      })
      it('passes exp', () => {
        const exp = api.createSimpleExpression({ isStatic: true, content: 'foo' })
        const newDirective = api.createDirective({ name: 'bind', exp })
        expect(newDirective).toHaveProperty('exp', exp)
        expectStringifiedDirective(newDirective, 'v-bind="foo"')
      })
      it('passes arg', () => {
        const arg = api.createSimpleExpression({ isStatic: true, content: 'foo' })
        const newDirective = api.createDirective({ name: 'bind', arg })
        expect(newDirective).toHaveProperty('arg', arg)
        expectStringifiedDirective(newDirective, 'v-bind:foo')
      })
      it('passes modifiers', () => {
        const arg = api.createSimpleExpression({ isStatic: true, content: 'click' })
        const modifiers = ['prevent', 'once']
        const newDirective = api.createDirective({ name: 'on', arg, modifiers })
        expect(newDirective).toHaveProperty('modifiers', modifiers)
        expectStringifiedDirective(newDirective, '@click.prevent.once')
      })

      it('creates directive of type v-cloak', () => {
        const newDirective = api.createVCloakDirective()
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'cloak')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-cloak')
      })

      it('creates directive of type v-else', () => {
        const newDirective = api.createVElseDirective()
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'else')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-else')
      })

      it('creates directive of type v-once', () => {
        const newDirective = api.createVOnceDirective()
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'once')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-once')
      })

      it('creates directive of type v-else-if', () => {
        const condition = api.createSimpleExpression({
          content: 'condition',
          isStatic: false,
        })
        const newDirective = api.createVElseIfDirective({
          condition,
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'else-if')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', condition)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-else-if="condition"')
      })

      it('creates directive of type v-if', () => {
        const condition = api.createSimpleExpression({
          content: 'condition',
          isStatic: false,
        })
        const newDirective = api.createVIfDirective({
          condition,
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'if')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', condition)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-if="condition"')
      })

      it('creates directive of type v-show', () => {
        const condition = api.createSimpleExpression({
          content: 'condition',
          isStatic: false,
        })
        const newDirective = api.createVShowDirective({
          condition,
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'show')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', condition)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-show="condition"')
      })

      it('creates directive of type v-html', () => {
        const exp = api.createSimpleExpression({
          content: 'variable',
          isStatic: false,
        })
        const newDirective = api.createVHTMLDirective({
          exp,
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'html')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', exp)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-html="variable"')
      })

      it('creates directive of type v-text', () => {
        const exp = api.createSimpleExpression({
          content: 'variable',
          isStatic: false,
        })
        const newDirective = api.createVTextDirective({
          exp,
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'text')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', exp)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-text="variable"')
      })

      it('creates directive of type v-memo with no dependency', () => {
        const newDirective = api.createVMemoDirective({
          dependencies: [],
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'memo')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp' /* TODO match a compound array */)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-memo="[]"')
      })

      it.skip('creates directive of type v-memo with one dependency', () => {
        const exp = api.createSimpleExpression({
          content: 'variable',
          isStatic: false,
        })
        const newDirective = api.createVMemoDirective({
          dependencies: [exp],
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'memo')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp' /* TODO match a compound array */)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-memo="[variable]"')
      })

      it.skip('creates directive of type v-memo with several dependencies', () => {
        const exp1 = api.createSimpleExpression({
          content: 'variable',
          isStatic: false,
        })
        const exp2 = api.createSimpleExpression({
          content: 'otherVariable',
          isStatic: false,
        })
        const newDirective = api.createVMemoDirective({
          dependencies: [exp1, exp2],
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'memo')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp' /* TODO match a compound array */)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-memo="[variable, otherVariable]"')
      })

      it('creates directive of type style', () => {
        const newDirective = api.createStyleAttr({
          style: {
            backgroundColor: 'thistle',
            borderRadius: '4px',
          },
        })
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'bind')
        expect(newDirective).toHaveProperty(
          'arg',
          expect.objectContaining({
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'style',
          }),
        )
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(
          newDirective,
          ':style="{"backgroundColor":"thistle","borderRadius":"4px"}"',
        )
      })

      it('creates directive of type v-bind with shorthand', () => {
        const newDirective = api.createVBindDirective({
          prop: 'class',
          // TODO: make this a createCompoundExpression
          exp: api.createSimpleExpression({
            content: 'getElementClassNames',
            isStatic: true,
          }),
          shorthand: true,
        })

        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'bind')
        expect(newDirective).toHaveProperty(
          'arg',
          expect.objectContaining({
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'class',
          }),
        )
        expect(newDirective).toHaveProperty(
          'exp',
          expect.objectContaining({
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'getElementClassNames',
          }),
        )
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, ':class="getElementClassNames"')
      })

      it('creates directive of type v-bind with v-bind', () => {
        const newDirective = api.createVBindDirective({
          prop: 'class',
          // TODO: make this a createCompoundExpression
          exp: api.createSimpleExpression({
            content: 'getElementClassNames',
            isStatic: true,
          }),
          shorthand: false,
        })

        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'bind')
        expect(newDirective).toHaveProperty(
          'arg',
          expect.objectContaining({
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'class',
          }),
        )
        expect(newDirective).toHaveProperty(
          'exp',
          expect.objectContaining({
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'getElementClassNames',
          }),
        )
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-bind:class="getElementClassNames"')
      })

      it('creates directive of type v-bind without arg', () => {
        const newDirective = api.createVBindDirective({
          // TODO: make this a createCompoundExpression
          exp: api.createSimpleExpression({
            content: 'props',
            isStatic: true,
          }),
          shorthand: false,
        })

        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'bind')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty(
          'exp',
          expect.objectContaining({
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'props',
          }),
        )
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-bind="props"')
      })

      it('creates directive of type v-for on an array', () => {
        const newDirective = api._createVForDirective({
          source: 'list',
          value: 'item',
        })

        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'for')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-for="item in list"')
      })

      it('creates directive of type v-for on an array with index', () => {
        const newDirective = api._createVForDirective({
          source: 'list',
          value: 'item',
          index: 'index',
        })

        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'for')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-for="(item, index) in list"')
      })

      it('creates directive of type v-for on an object', () => {
        const newDirective = api._createVForDirective({
          source: 'myObj',
          key: 'key',
          value: 'value',
        })

        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'for')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-for="(value, key) in myObj"')
      })

      it('creates directive of type v-for on an object with index', () => {
        const newDirective = api._createVForDirective({
          source: 'myObj',
          index: 'index',
          key: 'key',
          value: 'value',
        })

        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'for')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedDirective(newDirective, 'v-for="(value, key, index) in myObj"')
      })
    })

    describe('createText', () => {
      // TODO
    })

    describe('createAttribute', () => {
      // TODO
    })

    describe('compareAttributeValues', () => {
      // TODO
    })

    describe('exploreAst', () => {
      // TODO
    })

    describe('findAstAttributes', () => {
      // TODO
    })

    describe('findAttributes', () => {
      // TODO
    })

    describe('findDirectives', () => {
      // TODO
    })

    describe('updateAttribute', () => {
      // TODO
    })

    describe('updateDirective', () => {
      // TODO
    })

    describe('removeAttribute', () => {
      // TODO
    })

    describe('removeDirective', () => {
      // TODO
    })
  })
})