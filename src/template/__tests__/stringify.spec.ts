import { compileTemplate } from '@vue/compiler-sfc'

import { stringify } from '../stringify'

function prepare(source: string) {
  return compileTemplate({
    source,
    filename: 'unit-test.vue',
    id: 'fake-id',
  })
}

function makeTestFunction(testFn: CallableFunction) {
  /* eslint-disable no-param-reassign */
  testFn.only = (...args) => testFn(...args, test.only)
  testFn.skip = (...args) => testFn(...args, test.skip)
  testFn.todo = ((description: string) => test.todo(`${description}`)) as (
    description: string,
    source: string,
  ) => void
  /* eslint-enable no-param-reassign */

  return testFn
}

const testUnequal = makeTestFunction(
  (description: string, source: string, outcome: string, runner = test) => {
    runner(description, () => {
      const result = prepare(source)
      expect(stringify(result.ast)).toEqual(outcome)
    })
  },
)
const testEqual = makeTestFunction((description: string, source: string, runner = test) => {
  testUnequal(description, source, source, runner)
})

describe('template', () => {
  describe('stringify', () => {
    describe('basics', () => {
      testEqual('empty template', '')
      testEqual('static text', 'Hello world')
      testEqual('static unary HTMLElement', '<hr />')
      testEqual('static HTMLElement', '<span></span>')
      testEqual('static HTMLElement with static child', '<span>Hello</span>')
      testEqual('static unary component', '<MyCustomComponent />')
      testEqual('static component', '<MyCustomComponent></MyCustomComponent>')
    })

    describe('props', () => {
      testEqual('static prop on HTMLElement', '<img aria-label="hello" />')
      testEqual('static class on HTMLElement', '<img class="text-primary" />')
      // eslint-disable-next-line no-useless-escape
      testUnequal(
        'static style',
        '<img style="color: thistle; color: lavender;" />',
        '<img :style="{"color":"lavender"}" />',
      )
      testEqual('inline style', '<img :style="{ color: \'thistle\' }" />')
      testEqual('style as var', '<img :style="styleObject" />')
      testEqual('style as arrays of vars', '<img :style="[baseStyles, overridingStyles]" />')
      testEqual(
        'style as object of arrays',
        "<img :style=\"{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }\" />",
      )
      testEqual('static key', '<img key="firstItem" />')
      testEqual(
        'static prop on component',
        '<MyCustomComponent aria-label="hello">Hello</MyCustomComponent>',
      )
      testEqual(
        'prop beyond root node',
        '<MyCustomComponent><div title="hello">Hello</div></MyCustomComponent>',
      )
      testEqual('boolean casting on prop', '<input type="text" disabled />')
      testEqual('dynamic prop with literal (number)', '<MyComponent :foo="2" />')
      testEqual('dynamic prop with literal (boolean)', '<MyComponent :foo="false" />')
      testEqual(
        'dynamic prop with literal (object)',
        '<MyComponent :foo="{ a: true, b: false }" />',
      )
      testEqual('dynamic prop with arithmetics', '<MyComponent :foo="2 + 4" />')
      testEqual('dynamic prop with variable', '<MyComponent :foo="myVar" />')
      testEqual('dynamic prop with deep variable', '<MyComponent :foo="myVar.foo" />')
      testEqual(
        'dynamic prop with arithmetics involving variables',
        '<MyComponent :foo="2 + myVar" />',
      )
      testEqual(
        'dynamic prop with arithmetics involving only variables',
        '<MyComponent :foo="myVar + myVar" />',
      )

      testEqual('is', '<component :is="MyComponent">Message</component>')
      testEqual('ref', '<component ref="myRef">Message</component>')
      testEqual('ref with v-for', '<li v-for="item in list" ref="itemRefs">{{ item }}</li>')
    })

    describe('v-bind', () => {
      testEqual('v-bind multiple props', '<MyComponent v-bind="componentProps" />')
      testEqual('dynamic prop with v-bind', '<MyComponent v-bind:foo="2" />')
      testEqual(
        'dynamic prop with shorthand and child without shorthand',
        '<div :title="title"><button v-bind:disabled="isDisabled">Click</button></div>',
      )
      testEqual(
        'dynamic prop without shorthand and child with shorthand',
        '<div v-bind:title="title"><button :disabled="isDisabled">Click</button></div>',
      )
      testEqual(
        'dynamic prop with shorthand and next sibling without shorthand',
        '<div><input v-bind:type="typeA" /><input :type="typeB" /></div>',
      )
      testEqual(
        'dynamic prop with shorthand and previous sibling without shorthand',
        '<div><input :type="typeA" /><input v-bind:type="typeB" /></div>',
      )
    })

    describe('slots', () => {
      testEqual('basic default slot', '<slot />')
      testEqual('basic named slot', '<slot name="label" />')
      testEqual('basic slot with fallback', '<slot name="label">Fallback</slot>')
      testEqual('template with shorthand', '<MyComp><template #label></template></MyComp>')
      testEqual('template with v-slot', '<MyComp><template v-slot:label></template></MyComp>')
      testEqual('scoped slot', '<slot :text="greetingMessage" :count="1" />')
      testEqual(
        'scoped slot with fallback using props',
        '<slot :text="greetingMessage" :count="1">{{ greetingMessage }}</slot>',
      )
      testEqual(
        'default scoped slot passing props',
        '<MyComponent v-slot="slotProps"><OtherComponent v-bind="slotProps" /></MyComponent>',
      )
      testEqual.todo(
        'default scoped slot interpolating props',
        '<MyComponent v-slot="slotProps">{{ slotProps.text }} {{ slotProps.count }}</MyComponent>',
      )
      testEqual(
        'named scoped slot passing props',
        '<MyComponent><template #label="slotProps"></template></MyComponent>',
      )
    })

    describe('dynamic slots', () => {
      testEqual(
        'dynamic slot name',
        '<MyComponent><template v-slot:[dynamicSlotName]>Foo</template></MyComponent>',
      )
      testEqual(
        'dynamic slot name with shorthand',
        '<MyComponent><template #[dynamicSlotName]>Foo</template></MyComponent>',
      )
      testEqual(
        'dynamic slot name passing props',
        '<MyComponent><template #[dynamicSlotName]="slotProps"></template></MyComponent>',
      )
    })

    describe('events', () => {
      // TODO https://vuejs.org/api/built-in-directives.html#v-on
      testEqual(
        '@event with arrow function',
        '<button @click="(e) => emit(\'clicked\', e.currentTarget)">Accept</button>',
      )
      testEqual(
        '@event with inline statement',
        '<button @click="$emit(\'clicked\')">Accept</button>',
      )
      testEqual('@event with prop', '<button @click="clickHandlerProp">Accept</button>')
      testEqual(
        '@event with .once modifier',
        '<button @click.once="clickHandlerProp">Accept</button>',
      )
      testEqual(
        '@event with .prevent modifier',
        '<button @click.prevent="clickHandlerProp">Accept</button>',
      )
      testEqual(
        '@event with .stop modifier',
        '<button @click.stop="clickHandlerProp">Accept</button>',
      )

      testEqual(
        'v-on:event with arrow function',
        '<button v-on:click="(e) => emit(\'clicked\', e.currentTarget)">Accept</button>',
      )
      testEqual(
        'v-on:event with inline statement',
        '<button v-on:click="$emit(\'clicked\')">Accept</button>',
      )
      testEqual('v-on:event with prop', '<button v-on:click="clickHandlerProp">Accept</button>')
      testEqual(
        'v-on:event with modifiers',
        '<button v-on:click.once="clickHandlerProp">Accept</button>',
      )

      testEqual('dynamic event', '<button v-on:[event]="doThis"></button>')
      testEqual('shorthand dynamic event', '<button @[event]="doThis"></button>')

      testEqual('prevent default without expression', '<form @submit.prevent></form>')
      testEqual('chaining modifiers', '<button @click.stop.prevent="doThis"></button>')
      testEqual('key modifier using keyAlias', '<input @keyup.enter="onEnter" />')
      testEqual(
        'v-on object syntax',
        '<button v-on="{ mousedown: doThis, mouseup: doThat }"></button>',
      )
    })

    describe('v-for', () => {
      testEqual('v-for', '<li v-for="item in items">X</li>')
      testEqual('v-for with index', '<li v-for="(item, index) in items">X</li>')
      testEqual('v-for on object', '<li v-for="(value, key) in items">X</li>')
      testEqual('v-for on object with index', '<li v-for="(value, key, index) in items">X</li>')
      testEqual(
        'v-for with key and interpolation',
        '<li v-for="item in items" :key="item.id">{{ item.name }}</li>',
      )
    })

    describe('v-if', () => {
      testEqual('v-if', '<div v-if="someVariable">A</div>')
      testEqual(
        'v-if with other props at the start',
        '<MyComponent v-if="someVariable" title="A">A</MyComponent>',
      )
      testEqual(
        'v-if with other props in the middle',
        '<MyComponent aria-hidden v-if="someVariable" title="A">A</MyComponent>',
      )
      testEqual(
        'v-if with other props at the end',
        '<MyComponent title="A" v-if="someVariable">A</MyComponent>',
      )

      testEqual(
        'v-if with other directives',
        '<MyComponent v-bind="props" v-if="someVariable" title="A">A</MyComponent>',
      )
      testEqual('v-else-if', '<div v-if="showA">A</div>\n<div v-else-if="showBInstead">B</div>')

      testEqual('v-else', '<div v-if="showA">A</div>\n<div v-else>B</div>')
    })

    describe('misc directives', () => {
      testEqual('v-model', '<input v-model="myProp" value="choice1" type="checkbox" />')
      testEqual(
        'v-model with modifier',
        '<input v-model.trim="myProp" value="choice1" type="checkbox" />',
      )

      testEqual('v-cloak', '<div v-cloak>Message</div>')

      testEqual('v-memo', '<div v-memo="[a, b]">Message</div>')
      testEqual(
        'v-memo with v-for',
        '<div v-for="item in list" v-memo="[item.id === selected]"></div>',
      )

      testEqual('v-once', '<div v-once>Message</div>')

      testEqual('v-text with empty content', '<div v-text="Actual message"></div>')
      testEqual('v-text on unary element', '<div v-text="Actual message" />')
      testUnequal(
        'v-text with content loses its content',
        '<div v-text="Actual message">Lost message</div>',
        '<div v-text="Actual message"></div>',
      )

      testEqual('v-html', '<div v-html="rawHtml"></div>')

      testEqual('v-show', '<div v-show="someVariable">A</div>')
    })

    describe('undistinguishable directives', () => {
      testEqual('v-pre', '<div v-pre>{{ uncompiled }}</div>')
      testEqual(
        'v-pre with other props',
        '<MyComponent v-pre :foo="true">{{ uncompiled }}</MyComponent>',
      )
      testEqual(
        'v-pre with similarly named props',
        '<MyComponent v-pre :fav-preset="foo">{{ uncompiled }}</MyComponent>',
      )
      testEqual(
        'v-pre on similarly named tag',
        '<fav-preset v-pre :foo="true">{{ uncompiled }}</fav-preset>',
      )
      testEqual('v-pre in children', '<ul><li v-pre>A</li><li>B</li></ul>')
    })

    describe('comments', () => {
      testEqual('Single-line comment', '// Comment \n<div>Hi</div>')
      testEqual('Multi-line comment', '/* Comment */<div>Hi</div>')
      testEqual.todo('Multi-line in interpolation', '<div>Hi {{ foo /* Comment */ }}</div>')
      testEqual('Multi-line in dynamic prop', '<div :foo="bar /* Comment */">Hi</div>')
    })
  })
})
