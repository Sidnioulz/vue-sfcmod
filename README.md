# vue-sfcmod

![Status: Experimental](https://img.shields.io/badge/status-experimental-thistle) ![GitHub last commit](https://img.shields.io/github/last-commit/Sidnioulz/vue-sfcmod/main) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Sidnioulz/vue-sfcmod) [![Continuous Integration](https://github.com/Sidnioulz/vue-sfcmod/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/Sidnioulz/vue-sfcmod/actions/workflows/continuous-integration.yml) ![npm](https://img.shields.io/npm/v/vue-sfcmod)

`vue-sfcmod` is a framework for codemodding Vue 3 Single-File Components. It aims to support `<script>` codemods for both JavaScript and TypeScript with [JSCodeshift](https://github.com/facebook/jscodeshift), `<template>` codemods with the [Vue compiler](https://github.com/vuejs/core/tree/main/packages/compiler-sfc) and `<style>` codemods with tools to be determined.

This project couldn't exist without the prior work done by [vue-codemod](https://github.com/vuejs/vue-codemod). This repository started as a fork of `vue-codemod`. The decision to fork was made because:

- `vue-codemod` appears to be unmaintained since 2021
- `vue-codemod` supports both Vue 2 and Vue 3 whereas this project wants a smaller maintenance surface and only supports Vue 3
- This project targets the whole of SFC files, not just JavaScript
- `vue-codemod` ships and maintains transform scripts, whereas this project aims to provide a raw codemodding framework rather than pre-built codemods

This project also takes inspiration from [vue-template-ast-to-template](https://github.com/CommanderXL/vue-template-ast-to-template), a Vue 2 template stringifier. `vue-sfcmod` was rewritten from scratch to target Vue 3 ASTs, however.

## Install

```bash
yarn add -D vue-sfcmod
```

## Command Line Usage

`npx vue-sfcmod <path> -t <transformation> --params [transformation params] [...additional options]`

- `transformation` (required) - path to a module exporting a transformation function (JS/TS only) or an object with three transformation functions (`script` key for JS/TS, `template` for HTML and `style` for CSS)
- `path` (required) - files or directory to transform.
- `--params` (optional) - additional parameters passed to the transformation function

## Programmatic API

- `runTransformation(fileInfo, transformation, params)`

## Known Limitations

### Cannot combine v-text and children

Elements using the [`v-text` directive](https://vuejs.org/api/built-in-directives.html#v-text) _and_ children are not supported. The Vue compiler does not compile children of elements that use the [`v-text` directive](https://vuejs.org/api/built-in-directives.html#v-text), so we cannot provide the content of children.

### Cannot transform v-html content

Content inside [`v-html` directives](https://vuejs.org/api/built-in-directives.html#v-html) is printed as is and cannot be transformed.

### String style attributes are converted to JSON

When strings are passed to [`style` attributes](https://vuejs.org/guide/essentials/class-and-style.html#binding-inline-styles), it is converted to JSON (and deduplicated in the process). This is done by the Vue compiler, and attempting to undo that conversion could result in bugs in the template codemod engine.

## Roadmap

### Script

- [x] Support applying `jscodeshift` codemods to `.vue` files
- [x] Support for TypeScript
- [x] Support `<script setup>`

### Template

- [ ] Support `<template>` [#15](https://github.com/Sidnioulz/vue-sfcmod/issues/15)
- [ ] Add an API to search for, edit, remove and inject nodes in template ASTs
- [ ] Allow interpreting and modding JS expressions inside `<template>`

### Style

- [ ] Support `<style>` [#16](https://github.com/Sidnioulz/vue-sfcmod/issues/16)
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
