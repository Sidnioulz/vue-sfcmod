// @ts-nocheck
/* eslint-env jest */
import type { Transform } from 'jscodeshift'
import runTransformation from '../runTransformation'
import { tsStringKeyword, typeAnnotation } from '@babel/types'

const unreachableTransform: Transform = () => {
  throw new Error('This transform should never be invoked')
}

const addUseStrict: Transform = (file, api, options) => {
  const j = api.jscodeshift

  const hasStrictMode = (body) =>
    body.some((statement) =>
      j.match(statement, {
        type: 'ExpressionStatement',
        expression: {
          type: 'Literal',
          value: 'use strict',
        },
      }),
    )

  const withComments = (to, from) => {
    to.comments = from.comments
    return to
  }

  const createUseStrictExpression = () =>
    j.expressionStatement(j.literal('use strict'))

  const root = j(file.source)
  const body = root.get().value.program.body
  if (!body.length || hasStrictMode(body)) {
    return null
  }

  body.unshift(withComments(createUseStrictExpression(), body[0]))
  body[0].comments = body[1].comments
  delete body[1].comments

  return root.toSource(
    options.printOptions || { quote: 'single', lineTerminator: '\n' },
  )
}

const retypeParameter: Transform = (file, api, options) => {
  const j = api.jscodeshift

  const root = j(file.source)

  root
    .find(j.FunctionDeclaration)
    .filter((node) => node.value.params)
    .forEach((node) => {
      node.value.params
        .filter((param) => param.typeAnnotation)
        .map((param) => param.typeAnnotation)
        .forEach((annotation) => {
          annotation.typeAnnotation = j.tsNumberKeyword()
        })
    })

  return root.toSource(
    options.printOptions || { quote: 'single', lineTerminator: '\n' },
  )
}

const vueSfcSource = `<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>
<script>
import HelloWorld from './components/HelloWorld.vue';

export default {
  name: 'App',
  components: {
    HelloWorld
  }
};
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`

const vueSfcSetupSource = `<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>
<script setup>
import HelloWorld from './components/HelloWorld.vue';

defineOptions({
  name: 'App',
});
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`

const vueSfcLangTsSource = `<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>
<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';

defineProps<{
  foo: string
}>()

defineOptions({
  name: 'App',
});
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`

const addUseStrictResult = `<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>
<script>
'use strict';
import HelloWorld from './components/HelloWorld.vue';

export default {
  name: 'App',
  components: {
    HelloWorld
  }
};
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`

const addUseStrictResultWithSetup = `<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>
<script setup>
'use strict';
import HelloWorld from './components/HelloWorld.vue';

defineOptions({
  name: 'App',
});
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`

const addUseStrictResultWithLangTs = `<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>
<script lang="ts" setup>
'use strict';
import HelloWorld from './components/HelloWorld.vue';

defineProps<{
  foo: string
}>()

defineOptions({
  name: 'App',
});
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`

describe('run-transformation', () => {
  it('transforms .js files', () => {
    const source = `function a() { console.log('hello') }`
    const file = { path: '/tmp/a.js', source }
    const result = runTransformation(file, addUseStrict)
    expect(result).toBe(`'use strict';\nfunction a() { console.log('hello') }`)
  })
  it('transforms .ts files', () => {
    const source = `function a(name: string) { console.log('hello', name) }`
    const file = { path: '/tmp/a.ts', source }
    const result = runTransformation(file, retypeParameter)
    expect(result).toBe(
      `function a(name: number) { console.log('hello', name) }`,
    )
  })

  it('transforms script blocks in .vue files with JS transform', () => {
    const file = { path: '/tmp/scriptJSTransform.vue', source: vueSfcSource }
    const result = runTransformation(file, addUseStrict)
    expect(result).toBe(addUseStrictResult)
  })

  it('transforms script setup blocks in .vue files with JS transform', () => {
    const file = {
      path: '/tmp/scriptSetupJSTransform.vue',
      source: vueSfcSetupSource,
    }
    const result = runTransformation(file, addUseStrict)
    expect(result).toBe(addUseStrictResultWithSetup)
  })

  it('transforms <script> in .vue files with Vue transform', () => {
    const file = { path: '/tmp/script.vue', source: vueSfcSource }
    const result = runTransformation(file, {
      script: addUseStrict,
    })
    expect(result).toBe(addUseStrictResult)
  })

  it('transforms <script setup> in .vue files with Vue transform', () => {
    const file = { path: '/tmp/scriptSetup.vue', source: vueSfcSetupSource }
    const result = runTransformation(file, {
      script: addUseStrict,
    })
    expect(result).toBe(addUseStrictResultWithSetup)
  })

  it('transforms <script setup lang="ts> in .vue files with Vue transform', () => {
    const file = { path: '/tmp/scriptLangTs.vue', source: vueSfcLangTsSource }
    const result = runTransformation(file, {
      script: addUseStrict,
    })
    expect(result).toBe(addUseStrictResultWithLangTs)
  })

  it('(jscodeshift transforms) skips .vue files without script blocks', () => {
    const source = `
      <template>
        <div id="app">
          <img alt="Vue logo" src="./assets/logo.png">
          <HelloWorld msg="Welcome to Your Vue.js App"/>
        </div>
      </template>

      <style>
      #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
      }
      </style>`
    const result = runTransformation(
      {
        path: '/tmp/e.vue',
        source,
      },
      unreachableTransform,
    )

    expect(result).toEqual(source)
  })

  it.todo('(VueTransformation) transforms template blocks in .vue files')
})
