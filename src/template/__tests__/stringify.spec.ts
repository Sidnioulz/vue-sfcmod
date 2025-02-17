import { compileTemplate } from '@vue/compiler-sfc'

import SampleOne from '../../__fixtures__/One'
import { html } from '../../utils/html'
import { stringify } from '../stringify'

function prepare(source: string) {
  return compileTemplate({
    source,
    filename: 'unit-test.vue',
    id: 'fake-id',
  })
}

function makeTestFunction(testFn: CallableFunction) {
  const augmentedFn = (...args) => testFn(...args)
  augmentedFn.only = (...args) => testFn(...args, test.only)
  augmentedFn.skip = (...args) => testFn(...args, test.skip)
  augmentedFn.todo = ((description: string) => test.todo(`${description}`)) as (
    description: string,
    source: string,
  ) => void

  return augmentedFn
}

const testUnequal = makeTestFunction(
  (description: string, source: string, outcome: string, runner = test) => {
    runner(description, () => {
      const result = prepare(source)

      const normalisedOutcome = outcome.replace(/\n */g, '')
      const normalisedResult = stringify(result.ast).replace(/\n */g, '')

      expect(normalisedResult).toEqual(normalisedOutcome)
    })
  },
)
const testEqual = makeTestFunction((description: string, source: string, runner = test) => {
  testUnequal(description, source, source, runner)
})
const testWholeSfc = makeTestFunction((description: string, source: string, runner = test) => {
  runner(description, () => {
    const result = prepare(source)

    const templateOnlyRe = /<template>.*<\/template>/

    const normalisedSource = source.replace(/\n */g, '').match(templateOnlyRe)[0]
    const normalisedResult = stringify(result.ast).replace(/\n */g, '')

    expect(normalisedResult).toEqual(normalisedSource)
  })
})

describe('template', () => {
  describe('stringify', () => {
    describe('basics', () => {
      testEqual('empty template', html``)
      testEqual('static text', html`Hello world`)
      testEqual('static unary HTMLElement', html`<hr />`)
      testEqual('static HTMLElement', html`<span></span>`)
      testEqual('static HTMLElement with static child', html`<span>Hello</span>`)
      testEqual('static unary component', html`<MyCustomComponent />`)
      testEqual('static component', html`<MyCustomComponent></MyCustomComponent>`)
    })

    describe('props', () => {
      testEqual('static prop on HTMLElement', html`<img aria-label="hello" />`)
      testEqual('static class on HTMLElement', html`<img class="text-primary" />`)
      testEqual('respects attribute hyphenation', html`<img some-prop="text-primary" />`)

      testUnequal(
        'static style',
        html`<img style="color: thistle; color: lavender;" />`,
        html`<img :style="{"color":"lavender"}" />`,
      )
      testEqual('inline style', html`<img :style="{ color: 'thistle' }" />`)
      testEqual('style as var', html`<img :style="styleObject" />`)
      testEqual('style as arrays of vars', html`<img :style="[baseStyles, overridingStyles]" />`)
      testEqual(
        'style as object of arrays',
        html`<img :style="{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }" />`,
      )
      testEqual('static img src', html`<img src="http://example.com/img.png" />`)
      testEqual('dynamic img src', html`<img :src="myImageUrl" />`)
      testEqual('static key', html`<img key="firstItem" />`)
      testEqual(
        'static prop on component',
        html`<MyCustomComponent aria-label="hello">Hello</MyCustomComponent>`,
      )
      testEqual(
        'prop beyond root node',
        html`<MyCustomComponent><div title="hello">Hello</div></MyCustomComponent>`,
      )
      testEqual('boolean casting on prop', html`<input type="text" disabled />`)
      testEqual('dynamic prop with literal (number)', html`<MyComponent :foo="2" />`)
      testEqual('dynamic prop with literal (boolean)', html`<MyComponent :foo="false" />`)
      testEqual(
        'dynamic prop with literal (object)',
        html`<MyComponent :foo="{ a: true, b: false }" />`,
      )
      testEqual('dynamic prop with arithmetics', html`<MyComponent :foo="2 + 4" />`)
      testEqual('dynamic prop with variable', html`<MyComponent :foo="myVar" />`)
      testEqual('dynamic prop with deep variable', html`<MyComponent :foo="myVar.foo" />`)
      testEqual(
        'dynamic prop with arithmetics involving variables',
        html`<MyComponent :foo="2 + myVar" />`,
      )
      testEqual(
        'dynamic prop with arithmetics involving only variables',
        html`<MyComponent :foo="myVar + myVar" />`,
      )

      testEqual('is', html`<component :is="MyComponent">Message</component>`)
      testEqual('ref', html`<component ref="myRef">Message</component>`)
      testEqual('ref with v-for', html`<li v-for="item in list" ref="itemRefs">{{ item }}</li>`)
    })

    describe('v-bind', () => {
      testEqual('v-bind multiple props', html`<MyComponent v-bind="componentProps" />`)
      testEqual('dynamic prop with v-bind', html`<MyComponent v-bind:foo="2" />`)
      testEqual('v-bind object', html`<MyComponent v-bind="{ count: foo }" />`)
      testEqual('v-bind object with shorthand prop', html`<MyComponent v-bind="{ count }" />`)
      testEqual(
        'v-bind object with multiple shorthand props',
        html`<MyComponent v-bind="{ count, foo: 2, label, bar: 'test' }" />`,
      )
      testEqual(
        'dynamic prop with shorthand and child without shorthand',
        html`<div :title="title"><button v-bind:disabled="isDisabled">Click</button></div>`,
      )
      testEqual(
        'dynamic prop without shorthand and child with shorthand',
        html`<div v-bind:title="title"><button :disabled="isDisabled">Click</button></div>`,
      )
      testEqual(
        'dynamic prop with shorthand and next sibling without shorthand',
        html`<div><input v-bind:type="typeA" /><input :type="typeB" /></div>`,
      )
      testEqual(
        'dynamic prop with shorthand and previous sibling without shorthand',
        html`<div><input :type="typeA" /><input v-bind:type="typeB" /></div>`,
      )
    })

    describe('slots', () => {
      testEqual('basic default slot', html`<slot />`)
      testEqual('basic named slot', html`<slot name="label" />`)
      testEqual('basic slot with fallback', html`<slot name="label">Fallback</slot>`)
      testEqual('template with shorthand', html`<MyComp><template #label></template></MyComp>`)
      testEqual('template with v-slot', html`<MyComp><template v-slot:label></template></MyComp>`)
      testEqual('scoped slot', html`<slot :text="greetingMessage" :count="1" />`)
      testEqual(
        'scoped slot with fallback using props',
        html`<slot :text="greetingMessage" :count="1">{{ greetingMessage }}</slot>`,
      )
      testEqual(
        'default scoped slot passing props',
        html`<MyComponent v-slot="slotProps"><OtherComponent v-bind="slotProps" /></MyComponent>`,
      )
      testEqual(
        'default scoped slot interpolating props',
        html`<MyComponent v-slot="slotProps"
          >{{ slotProps.text }} {{ slotProps.count }}</MyComponent
        >`,
      )
      testEqual(
        'named scoped slot passing props',
        html`<MyComponent><template #label="slotProps"></template></MyComponent>`,
      )
    })

    describe('dynamic slots', () => {
      testEqual(
        'dynamic slot name',
        html`<MyComponent><template v-slot:[dynamicSlotName]>Foo</template></MyComponent>`,
      )
      testEqual(
        'dynamic slot name with shorthand',
        html`<MyComponent><template #[dynamicSlotName]>Foo</template></MyComponent>`,
      )
      testEqual(
        'dynamic slot name passing props',
        html`<MyComponent><template #[dynamicSlotName]="slotProps"></template></MyComponent>`,
      )
      testEqual(
        'dynamic slot name with template literal',

        '<MyComponent><template #[`${step.key}-date`]></template></MyComponent>',
      )
      testEqual(
        'dynamic slot name with template literal and v-for',

        '<MyComponent v-bind="props"><template v-for="step in steps" :key="step.key" #[`${step.key}-date`]></template></MyComponent>',
      )
    })

    describe('events', () => {
      testEqual(
        '@event with arrow function',
        html`<button @click="(e) => emit('clicked', e.currentTarget)">Accept</button>`,
      )
      testEqual(
        '@event with inline statement',
        html`<button @click="$emit('clicked')">Accept</button>`,
      )
      testEqual('@event with prop', html`<button @click="clickHandlerProp">Accept</button>`)
      testEqual(
        '@event with .once modifier',
        html`<button @click.once="clickHandlerProp">Accept</button>`,
      )
      testEqual(
        '@event with .prevent modifier',
        html`<button @click.prevent="clickHandlerProp">Accept</button>`,
      )
      testEqual(
        '@event with .stop modifier',
        html`<button @click.stop="clickHandlerProp">Accept</button>`,
      )

      testEqual(
        'v-on:event with arrow function',
        html`<button v-on:click="(e) => emit('clicked', e.currentTarget)">Accept</button>`,
      )
      testEqual(
        'v-on:event with inline statement',
        html`<button v-on:click="$emit('clicked')">Accept</button>`,
      )
      testEqual('v-on:event with prop', html`<button v-on:click="clickHandlerProp">Accept</button>`)
      testEqual(
        'v-on:event with modifiers',
        html`<button v-on:click.once="clickHandlerProp">Accept</button>`,
      )

      testEqual('dynamic event', html`<button v-on:[event]="doThis"></button>`)
      testEqual('shorthand dynamic event', html`<button @[event]="doThis"></button>`)

      testEqual('prevent default without expression', html`<form @submit.prevent></form>`)
      testEqual('chaining modifiers', html`<button @click.stop.prevent="doThis"></button>`)
      testEqual('key modifier using keyAlias', html`<input @keyup.enter="onEnter" />`)
      testEqual(
        'v-on object syntax',
        html`<button v-on="{ mousedown: doThis, mouseup: doThat }"></button>`,
      )
    })

    describe('v-for', () => {
      testEqual('v-for', html`<li v-for="item in items">X</li>`)
      testEqual('v-for with index', html`<li v-for="(item, index) in items">X</li>`)
      testEqual('v-for on object', html`<li v-for="(value, key) in items">X</li>`)
      testEqual('v-for on object with index', html`<li v-for="(value, key, index) in items">X</li>`)
      testEqual(
        'v-for with key and interpolation',
        html`<li v-for="item in items" :key="item.id">{{ item.name }}</li>`,
      )
      testEqual(
        'template v-for',
        html`<template v-for="(item, index) in previewItems">{{ item }}</template>`,
      )
      testEqual(
        'template v-for with extra attrs',
        html`<MyComp
          ><template #preview v-for="(item, index) in previewItems">{{ item }}</template></MyComp
        >`,
      )
      testEqual(
        'template v-for with key',
        html`<MyComp
          ><template v-for="(item, index) in previewItems" :key="item.id"
            >{{ item }}</template
          ></MyComp
        >`,
      )
      testEqual(
        'v-if inside template v-for',
        html`<template v-for="(item, index) in previewItems"><div v-if="foo">Foo</div></template>`,
      )
      testEqual(
        'v-for in v-for',
        html`<li v-for="(value, key) in items">
          <span v-for="dataEndpoint in value">{{ dataEndpoint }} ,</span>
        </li>`,
      )
      testEqual(
        'v-for in template v-for',
        html`<MyComp
          ><template v-for="item in previewItems"
            ><span v-for="dataEndpoint in item">{{ dataEndpoint }} ,</span></template
          ></MyComp
        >`,
      )
    })

    describe('v-if', () => {
      testEqual('v-if', html`<div v-if="someVariable">A</div>`)
      testEqual(
        'v-if with other props at the start',
        html`<MyComponent v-if="someVariable" title="A">A</MyComponent>`,
      )
      testEqual(
        'v-if with other props in the middle',
        html`<MyComponent aria-hidden v-if="someVariable" title="A">A</MyComponent>`,
      )
      testEqual(
        'v-if with other props at the end',
        html`<MyComponent title="A" v-if="someVariable">A</MyComponent>`,
      )

      testEqual(
        'v-if with other directives',
        html`<MyComponent v-bind="props" v-if="someVariable" title="A">A</MyComponent>`,
      )
      testEqual(
        'v-else-if',
        html`<div v-if="showA">A</div>
          <div v-else-if="showBInstead">B</div>`,
      )

      testEqual(
        'v-else',
        html`<div v-if="showA">A</div>
          <div v-else>B</div>`,
      )

      testEqual('template v-if', html`<template v-if="hasItem">{{ item }}</template>`)
      testEqual(
        'template v-if with extra attrs',
        html`<MyComp><template #preview v-if="hasItem">{{ item }}</template></MyComp>`,
      )
      testEqual(
        'template v-if with key',
        html`<MyComp><template v-if="hasItem" :key="item.id">{{ item }}</template></MyComp>`,
      )
      testEqual(
        'v-if in v-if',
        html`<li v-if="hasItem"><span v-if="dataEndpoint">{{ dataEndpoint }}</span></li>`,
      )
      testEqual(
        'v-if in template v-if',
        html`<MyComp
          ><template v-if="hasItem"
            ><span v-if="dataEndpoint">{{ dataEndpoint }}</span></template
          ></MyComp
        >`,
      )
    })

    describe('misc directives', () => {
      testEqual('v-model', html`<input v-model="myProp" value="choice1" type="checkbox" />`)
      testEqual(
        'v-model with modifier',
        html`<input v-model.trim="myProp" value="choice1" type="checkbox" />`,
      )

      testEqual('v-cloak', html`<div v-cloak>Message</div>`)

      testEqual('v-memo', html`<div v-memo="[a, b]">Message</div>`)
      testEqual(
        'v-memo with v-for',
        html`<div v-for="item in list" v-memo="[item.id === selected]"></div>`,
      )

      testEqual('v-once', html`<div v-once>Message</div>`)

      testEqual('v-text with empty content', html`<div v-text="Actual message"></div>`)
      testEqual('v-text on unary element', html`<div v-text="Actual message" />`)
      testUnequal(
        'v-text with content loses its content',
        html`<div v-text="Actual message">Lost message</div>`,
        html`<div v-text="Actual message"></div>`,
      )

      testEqual('v-html', html`<div v-html="rawHtml"></div>`)

      testEqual('v-show', html`<div v-show="someVariable">A</div>`)
    })

    describe('undistinguishable directives', () => {
      testEqual('v-pre', html`<div v-pre>{{ uncompiled }}</div>`)
      testEqual(
        'v-pre with other props',
        html`<MyComponent v-pre :foo="true">{{ uncompiled }}</MyComponent>`,
      )
      testEqual(
        'v-pre with similarly named props',
        html`<MyComponent v-pre :fav-preset="foo">{{ uncompiled }}</MyComponent>`,
      )
      testEqual(
        'v-pre on similarly named tag',
        html`<fav-preset v-pre :foo="true">{{ uncompiled }}</fav-preset>`,
      )
      testEqual(
        'v-pre in children',
        html`<ul>
          <li v-pre>A</li>
          <li>B</li>
        </ul>`,
      )
    })

    // We don't use the html util all the time here because the AST
    // contains trailing spaces for comment text nodes, and our Prettier
    // instance would remove them from the test code if we used html.
    // Those whitespaces are easier to fix post-transform with a formatter
    // than inside the stringifier, so they're tolerated and unit tests
    // are adjusted accordingly.
    describe('comments', () => {
      testEqual('HTML comment', html`<div>Foo<!-- Comment -->Bar</div>`)
      testEqual(
        'Consecutives lines of comments',
        '<div>\n<!-- Comment -->\n<!-- Comment -->\nFoo \n</div>',
      )
      testEqual('Single-line comment', '// Comment \n<div>Hi</div>')
      testEqual('Multi-line comment', '/* Comment */ \n<div>Hi</div>')
      testEqual('Multi-line in interpolation', html`<div>Hi {{ foo /* Comment */ }}</div>`)
      testEqual('Multi-line in dynamic prop', html`<div :foo="bar /* Comment */">Hi</div>`)
    })

    describe('transition', () => {
      testEqual('Basic transition', html`<Transition><input /><input /></Transition>`)
      testEqual(
        'Removes persisted when a child has the v-show directive',
        html`<transition><MyComponent v-show="isOpen" /></transition>`,
      )
      testEqual(
        'Comment inside transition group',
        html`<TransitionGroup><!-- Comment --><input /></TransitionGroup>`,
      )
      testUnequal(
        'Comment inside transition',
        html`<Transition><!-- Comment --><input /></Transition>`,
        html`<Transition><input /></Transition>`,
      )
    })

    describe('CompoundExpression rewriting', () => {
      testEqual('Interpolation', html`<div>{{ foo }}</div>`)
      testEqual('Interpolation + Interpolation', html`<div>{{ foo }}{{ bar }}</div>`)
      testEqual('Interpolation + space + Interpolation', html`<div>{{ foo }} {{ bar }}</div>`)
      testEqual('SimpleExpression', html`<MyComponent :foo="myVar" />`)
      testEqual('SimpleExpression + SimpleExpression', html`<MyComponent :foo="var1 + var2" />`)
      testEqual('Text + Interpolation', html`<div>Hello {{ foo }}</div>`)
      testEqual('Interpolation + Text', html`<div>{{ foo }} World</div>`)
      testEqual('Text + Interpolation + Text', html`<div>Hello {{ foo }} World</div>`)
    })
  })

  describe('stringify with script info', () => {
    testWholeSfc('img src turned into import', SampleOne)
  })
})
