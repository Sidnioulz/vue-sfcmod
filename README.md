# vue-sfcmod

![Status: Not actively maintained](https://img.shields.io/badge/status-Not_actively_maintained-orangered) ![GitHub last commit](https://img.shields.io/github/last-commit/Sidnioulz/vue-sfcmod/main) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Sidnioulz/vue-sfcmod) [![Continuous Integration](https://github.com/Sidnioulz/vue-sfcmod/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/Sidnioulz/vue-sfcmod/actions/workflows/continuous-integration.yml) [![codecov](https://codecov.io/gh/Sidnioulz/vue-sfcmod/graph/badge.svg?token=4SX3N57XH3)](https://codecov.io/gh/Sidnioulz/vue-sfcmod) ![npm](https://img.shields.io/npm/v/vue-sfcmod)

`vue-sfcmod` is a framework for codemodding Vue 3 Single-File Components. It aims to support `<script>` codemods for both JavaScript and TypeScript with [JSCodeshift](https://github.com/facebook/jscodeshift), `<template>` codemods with the [Vue compiler](https://github.com/vuejs/core/tree/main/packages/compiler-sfc) and `<style>` codemods with tools to be determined.

This project couldn't exist without the prior work done by [vue-codemod](https://github.com/vuejs/vue-codemod). This repository started as a fork of `vue-codemod`. The decision to fork was made because:

- `vue-codemod` appears to be unmaintained since 2021
- `vue-codemod` supports both Vue 2 and Vue 3 whereas this project wants a smaller maintenance surface and only supports Vue 3
- This project targets the whole of SFC files, not just JavaScript
- `vue-codemod` ships and maintains transform scripts, whereas this project aims to provide a raw codemodding framework rather than pre-built codemods

This project also takes inspiration from [vue-template-ast-to-template](https://github.com/CommanderXL/vue-template-ast-to-template), a Vue 2 template stringifier. `vue-sfcmod` was rewritten from scratch to target Vue 3 ASTs, however.

## Call for maintainers 🛟📣

**I'm looking for co-maintainers with expertise on the Vue.js compiler.** The lack of documentation on the compiler prevents me from fully implementing an API and stringifier for Vue codemodding. I have to reverse engineer the AST and figure out what's expected, and I run into occasional limitations that I believe are due to the compiler not being written with codemodding in mind.

**I need help from someone with expertise in Vue.js internals** and with the ability to push for change within the Vue compiler ecosystem if needed. There are limitations to what vue-sfcmod can do (described below in this README) that I can't work around without changes to the compiler to directly support rewriting an AST into source code. I am also stuck with codegen nodes, as part of their execution context is handled implicitly and they can't be passed to a JS codemodding engine as is without reconstructing the context (which I don't know how to do since the context isn't documented).

I can't justify the time it takes me to reverse engineer the AST to improve coverage, so I'm unlikely to keep improving the Vue API on my own. However, **I remain committed to improving the CLI to support both codemodding and static analysis** needs.

## Install

```bash
yarn add -D vue-sfcmod
```

## Command Line Usage

To transform files, type the following command:

```sh
yarn vue-sfcmod <path> -t <transformation>
```

- `path` (required) - files or directory to transform
- `transformation` - path to a module exporting a transformation function (JS/TS only) or an object with transformation functions:
  - `script` key for `<script>`, `<script setup>` and JS/TS files
  - `template` for HTML `<template>`
  - `style` for CSS and `<style>` (not yet implemented)

### With preset transformation

```sh
yarn vue-sfcmod <path>
```

The `-t transformation` parameter is optional. If unset, `vue-sfcmod` will launch an interactive prompt to let users select a preset transformation to run. To configure presets, create a configuration file as explained in the next section.

### With multiple files or paths

```sh
yarn vue-sfcmod <path 1> <path 2> <path 3> -t <transformation>
```

You may pass as many paths as you like. Each is resolved using [globby](https://github.com/sindresorhus/globby).

### With transformation options

```sh
yarn vue-sfcmod <path> -t <transformation> --custom-flag --foo=value --bar value
```

You may pass custom CLI parameters that will be passed to transformation functions. Three syntaxes are supported:

- `--custom-flag` without a value is mapped to `{ customFlag: true }`
- `--foo=value` is mapped to `{ foo: value }`
- `--bar value` is mapped to `{ bar: value }`

Custom parameter names are converted to Pascal case in the object received by transformation functions. Check out [the `params` example](https://github.com/Sidnioulz/vue-sfcmod/blob/main/examples/params) for a fully working example.

### Other flags

- `vue-sfcmod --version` prints the current version
- `vue-sfcmod --help` prints usage documentation

--custom-opt [custom value, else customOpt will be true] [...add as many custom opts as wanted]`

Any CLI option you pass apart from `--version`, `--help` and `-t` will be passed to the script, style and template transformation functions in an object. For instance, if you pass `--classes-to-add="foo bar"`, you'll receive `{ classesToAdd: 'foo bar' }` as a third argument to your transformation functions.

## Config File

To pass configuration options to `vue-sfcmod`, create a `sfcmod.config.ts` file at the root of your project. Below is a sample configuration file. You can also check out the [full sample file](https://github.com/Sidnioulz/vue-sfcmod/blob/main/sfcmod.config.example.ts).

```ts
import type { SfcmodConfig } from 'vue-sfcmod'

const config: SfcmodConfig = {
  // ...
}

export default config
```

This project uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig#cosmiconfig) to read configuration files. Check the documentation for a full list of supported syntaxes and file names. TypeScript usage is recommended to get IDE autocompletion and type checking.

### `presets`

Array of paths to preset transformation files, that are proposed to end users in an interactive prompt when they don't pass a `-t` flag to the CLI.

```ts
string | { glob: string, name: (string) => string }
```

Each item in the array can either be a glob (resolved with [globby](https://github.com/sindresorhus/globby)), or an object with a `glob` property and a `name` property. The `name` property is a function called for each file matched by the glob. It receives the path as an input, and outputs a name used in the interactive prompt.

```ts
  presets: [
    {
      // In this example, we use folder names as a name in the CLI.
      glob: './examples/**/transformation.cjs',
      name: (filePath: string) =>
        filePath
          .replace(/\/transformation.cjs$/, '')
          .split('/')
          .slice(-1)[0],
    },
  ],
```

## Programmatic API

To use `vue-sfcmod` programmatically, you may import the `runTransformation` function. It runs a transformation on a single file.

```ts
function runTransformation(
  fileInfo: {
    path: string
    source: string
  },
  transformationModule: TransformationModule,
  options?: { [key: string]: unknown },
): string
```

- `fileInfo` is the file to transform
  - `fileInfo.path` is used to distinguish Vue files from JS/TS files
  - `fileInfo.source` is the content of the file
- `transformationModule` is the file containing the transformation to apply (matching the signature of the `-t` CLI option)
- `options` is an arbitrary object of options passed to the transformation functions; it is optional

The function returns a `string`, containing the transformed content.

## Known Limitations

### Cannot combine v-text and children

Elements using the [`v-text` directive](https://vuejs.org/api/built-in-directives.html#v-text) _and_ children are not supported. The Vue compiler does not compile children of elements that use the [`v-text` directive](https://vuejs.org/api/built-in-directives.html#v-text), so we cannot provide the content of children.

### Cannot transform v-html content

Content inside [`v-html` directives](https://vuejs.org/api/built-in-directives.html#v-html) is printed as is and cannot be transformed.

### Cannot preserve comments inside `transition`

The built-in Vue [`transition` component](https://vuejs.org/guide/built-ins/transition.html) is returned by the Vue compiler without HTML comment children. Because the children are missing from the compiler AST, they cannot be recovered by vue-sfcmod. [Upstream issue](https://github.com/vuejs/core/issues/9047).

### String style attributes are converted to JSON

When strings are passed to [`style` attributes](https://vuejs.org/guide/essentials/class-and-style.html#binding-inline-styles), it is converted to JSON (and deduplicated in the process). This is done by the Vue compiler, and attempting to undo that conversion could result in bugs in the template codemod engine.

## Roadmap

### Script

- [x] Support applying `jscodeshift` codemods to `.vue` files
- [x] Support for TypeScript
- [x] Support `<script setup>`

### Template

- [x] Support `<template>` [#15](https://github.com/Sidnioulz/vue-sfcmod/issues/15)
- [x] Support passing parameters to template transformations
- [ ] _ongoing_ - Add an API to search for, edit, remove and inject nodes in template ASTs
- [ ] Allow interpreting and modding JS expressions inside `<template>`

### Style

- [ ] Support `<style>` [#16](https://github.com/Sidnioulz/vue-sfcmod/issues/16)
- [ ] Support passing parameters to style transformations
- [ ] Support :global, :slotted, etc
- [ ] Support PostCSS and SCSS style tags

### Project upkeep

- [x] Basic testing setup and a dummy CLI
- [ ] Branch test coverage above 80%
- [ ] Add working examples
- [ ] Add semantic-release

## Javascript/Typescript transformation

See https://github.com/facebook/jscodeshift#transform-module

## Template transformation

No API yet. You may manually modify the AST provided by the Vue SFC compiler.

## Post Transformation

Running transformations will generally ruin the formatting of your files. A recommended way to solve that problem is by using [Prettier](https://prettier.io/) or `eslint --fix`.
