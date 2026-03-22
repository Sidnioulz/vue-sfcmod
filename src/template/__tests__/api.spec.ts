import type { AttributeNode, DirectiveNode, Node } from '@vue/compiler-core'
import { NodeTypes } from '@vue/compiler-core'
import { compileTemplate } from '@vue/compiler-sfc'

import SampleOne from '../../__fixtures__/One'
import * as api from '../api'
import { stringifyNode, type StringifiableNode } from '../stringify'
import { genFakeLoc, isAttribute } from '../utils'

function prepare(source: string) {
  return compileTemplate({
    source,
    filename: 'unit-test.vue',
    id: 'fake-id',
  }).ast
}

function expectStringifiedPrivate(stringifier: () => StringifiableNode, outcome: string): void {
  expect(stringifyNode(stringifier())).toEqual(outcome)
}

function expectStringifiedNode(node: StringifiableNode, outcome: string): void {
  expectStringifiedPrivate(() => {
    return node
  }, outcome)
}

function expectStringifiedProp(node: AttributeNode | DirectiveNode, outcome: string): void {
  expectStringifiedPrivate(() => {
    return {
      type: NodeTypes.ELEMENT,
      isSelfClosing: true,
      tag: 'foo',
      tagType: 1,
      ns: 0,
      children: [],
      props: [node],
      loc: genFakeLoc(),
    } satisfies StringifiableNode
  }, `<foo ${outcome} />`)
}

describe('template', () => {
  describe('api', () => {
    describe('isGenerated', () => {
      it('returns false for the AST root', () => {
        const ast = prepare(SampleOne)
        assert(ast)
        expect(api.isGenerated(ast)).toBe(false)
        api.createText({ content: 'test' })
      })

      it('returns false for any element in a generated AST', () => {
        const ast = prepare(SampleOne)
        assert(ast)

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
        expectStringifiedProp(newDirective, 'v-pre')
      })

      it('only accepts known names', () => {
        expect(() => api.createDirective({ name: 'nonExistantDirective' })).toThrow()
      })

      it('passes exp', () => {
        const exp = api.createSimpleExpression({ isStatic: true, content: 'foo' })
        const newDirective = api.createDirective({ name: 'bind', exp })
        expect(newDirective).toHaveProperty('exp', exp)
        expectStringifiedProp(newDirective, 'v-bind="foo"')
      })

      it('passes arg', () => {
        const arg = api.createSimpleExpression({ isStatic: true, content: 'foo' })
        const newDirective = api.createDirective({ name: 'bind', arg })
        expect(newDirective).toHaveProperty('arg', arg)
        expectStringifiedProp(newDirective, 'v-bind:foo')
      })

      it('passes modifiers', () => {
        const arg = api.createSimpleExpression({ isStatic: true, content: 'click' })
        const modifiers = [
          api.createSimpleExpression({ content: 'prevent', isStatic: true }),
          api.createSimpleExpression({ content: 'once', isStatic: true }),
        ]
        const newDirective = api.createDirective({ name: 'on', arg, modifiers })
        expect(newDirective).toHaveProperty('modifiers', modifiers)
        expectStringifiedProp(newDirective, '@click.prevent.once')
      })
      it('handles string-typed modifiers from older Vue 3 versions', () => {
        const arg = api.createSimpleExpression({ isStatic: true, content: 'click' })
        const modifiers = ['prevent', 'once']
        // @ts-expect-error We're testing against an older API.
        const newDirective = api.createDirective({ name: 'on', arg, modifiers })
        expect(newDirective).toHaveProperty('modifiers')
        expect(newDirective.modifiers).toHaveLength(2)
        expect(newDirective.modifiers[0]).toMatchObject({
          content: 'prevent',
          isStatic: true,
        })
        expect(newDirective.modifiers[1]).toMatchObject({
          content: 'once',
          isStatic: true,
        })
        expectStringifiedProp(newDirective, '@click.prevent.once')
      })

      it('creates directive of type v-cloak', () => {
        const newDirective = api.createVCloakDirective()
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'cloak')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedProp(newDirective, 'v-cloak')
      })

      it('creates directive of type v-else', () => {
        const newDirective = api.createVElseDirective()
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'else')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedProp(newDirective, 'v-else')
      })

      it('creates directive of type v-once', () => {
        const newDirective = api.createVOnceDirective()
        expect(newDirective).toHaveProperty('type', NodeTypes.DIRECTIVE)
        expect(newDirective).toHaveProperty('name', 'once')
        expect(newDirective).toHaveProperty('arg', undefined)
        expect(newDirective).toHaveProperty('exp', undefined)
        expect(newDirective).toHaveProperty('modifiers', [])
        expectStringifiedProp(newDirective, 'v-once')
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
        expectStringifiedProp(newDirective, 'v-else-if="condition"')
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
        expectStringifiedProp(newDirective, 'v-if="condition"')
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
        expectStringifiedProp(newDirective, 'v-show="condition"')
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
        expectStringifiedProp(newDirective, 'v-html="variable"')
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
        expectStringifiedProp(newDirective, 'v-text="variable"')
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
        expectStringifiedProp(newDirective, 'v-memo="[]"')
      })

      it('creates directive of type v-memo with one dependency', () => {
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
        expectStringifiedProp(newDirective, 'v-memo="[variable]"')
      })

      it('creates directive of type v-memo with several dependencies', () => {
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
        expectStringifiedProp(newDirective, 'v-memo="[variable, otherVariable]"')
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
        expectStringifiedProp(
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
        expectStringifiedProp(newDirective, ':class="getElementClassNames"')
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
        expectStringifiedProp(newDirective, 'v-bind:class="getElementClassNames"')
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
        expectStringifiedProp(newDirective, 'v-bind="props"')
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
        expectStringifiedProp(newDirective, 'v-for="item in list"')
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
        expectStringifiedProp(newDirective, 'v-for="(item, index) in list"')
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
        expectStringifiedProp(newDirective, 'v-for="(value, key) in myObj"')
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
        expectStringifiedProp(newDirective, 'v-for="(value, key, index) in myObj"')
      })
    })

    describe('createAttribute', () => {
      it('creates an attribute without value', () => {
        const newAttribute = api.createAttribute({ name: 'checked' })

        expect(newAttribute).toHaveProperty('type', NodeTypes.ATTRIBUTE)
        expect(newAttribute).toHaveProperty('name', 'checked')
        expectStringifiedProp(newAttribute, 'checked')
      })

      it('creates an attribute with value', () => {
        const newAttribute = api.createAttribute({ name: 'foo', value: 'bar' })

        expect(newAttribute).toHaveProperty('type', NodeTypes.ATTRIBUTE)
        expect(newAttribute).toHaveProperty('name', 'foo')
        expectStringifiedProp(newAttribute, 'foo="bar"')
      })
    })

    describe('compareAttributeValues', () => {
      it('correctly equates nullish values', () => {
        expect(api.compareAttributeValues(undefined, undefined)).toBe(true)
      })

      it('correctly equates nullish to a TextNode with content "true"', () => {
        expect(api.compareAttributeValues(undefined, api.createText({ content: 'true' }))).toBe(
          true,
        )
      })

      it('correctly equates identical TextNodes', () => {
        const a = api.createText({ content: 'identical' })
        const b = api.createText({ content: 'identical' })
        expect(api.compareAttributeValues(a, b)).toBe(true)
      })

      it('correctly discriminates a nullish value and an unrelated string', () => {
        expect(
          api.compareAttributeValues(undefined, api.createText({ content: 'unrelated' })),
        ).toBe(false)
      })

      it('correctly discriminates unrelated TextNodes', () => {
        const a = api.createText({ content: 'identical' })
        const b = api.createText({ content: 'unrelated' })
        expect(api.compareAttributeValues(a, b)).toBe(false)
      })
    })

    describe('createText', () => {
      it('creates an empty TextNode with null', () => {
        const content = null
        // @ts-expect-error Testing the API.
        const newNode = api.createText({ content })

        expect(newNode).toHaveProperty('type', NodeTypes.TEXT)
        expect(newNode).toHaveProperty('content', content)
        expectStringifiedNode(newNode, '')
      })
      it('creates an empty TextNode with empty text', () => {
        const content = ''
        const newNode = api.createText({ content })

        expect(newNode).toHaveProperty('type', NodeTypes.TEXT)
        expect(newNode).toHaveProperty('content', content)
        expectStringifiedNode(newNode, '')
      })

      it('creates a TextNode with content', () => {
        const content = 'real'
        const newNode = api.createText({ content })

        expect(newNode).toHaveProperty('type', NodeTypes.TEXT)
        expect(newNode).toHaveProperty('content', content)
        expectStringifiedNode(newNode, 'real')
      })
    })

    describe('exploreAst', () => {
      const ast = prepare(SampleOne)
      assert(ast)

      it.each([
        ['when matching nothing', () => false],
        ['when matching some nodes', (node: Node) => node.type % 2],
        ['when matching everything', () => true],
      ])('calls the matcher function for every node %s', (description, matcherImplem) => {
        const matcher = vi.fn().mockImplementation(matcherImplem)

        api.exploreAst(ast, matcher)

        expect(matcher).toHaveBeenCalledTimes(182)
      })

      it('provides nodes to the matcher function', () => {
        const matcher = vi.fn()

        api.exploreAst(ast, matcher)

        expect(matcher).toHaveBeenCalledWith(ast.children[0])
      })

      it('returns only the nodes for which the matcher returned true', () => {
        const matcher = vi.fn().mockImplementation((node) => node === ast.children[0])

        const outcome = api.exploreAst(ast, matcher)

        expect(outcome).toHaveLength(1)
        expect(outcome[0]).toBe(ast.children[0])
      })

      it("doesn't return the same node twice", () => {
        const matcher = vi.fn().mockReturnValue(true)

        const neverSameNodeCache = new Set()
        const output = api.exploreAst(ast, matcher)

        for (const found of output) {
          expect(neverSameNodeCache.has(found)).toBe(false)
          neverSameNodeCache.add(found)
        }
      })
    })

    describe('findAstAttributes', () => {
      const ast = prepare(SampleOne)
      assert(ast)

      it('only calls the matcher on attributes', () => {
        api.findAstAttributes(ast, (node) => {
          expect(isAttribute(node)).toBeTruthy()

          return true
        })

        expect.assertions(15)
      })

      it('calls the matcher on all attributes', () => {
        api.findAstAttributes(ast, (node) => {
          expect(isAttribute(node)).toBeTruthy()

          return true
        })

        expect.assertions(15)
      })
      // TODO
    })

    describe.todo('findAttributes', () => {
      // TODO
    })

    describe.todo('findDirectives', () => {
      // TODO
    })

    describe.todo('updateAttribute', () => {
      // TODO
    })

    describe.todo('updateDirective', () => {
      // TODO
    })

    describe.todo('removeAttribute', () => {
      // TODO
    })

    describe.todo('removeDirective', () => {
      // TODO
    })

    // TODO createRootNode
    // TODO add child to container-type node like RootNode
    // TODO remove child from container-type node like RootNode
    // TODO reorder children in container-type node like RootNode
  })
})
