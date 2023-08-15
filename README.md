# vue-sfcmod

**Current status: experimental, under active development**

`vue-sfcmod` is a framework for codemodding Vue 3 Single-File Components. It aims to support `<script>` codemods for both JavaScript and TypeScript with [JSCodeshift](https://github.com/facebook/jscodeshift), `<template>` codemods with the [Vue compiler](https://github.com/vuejs/core/tree/main/packages/compiler-sfc) and `<style>` codemods with tools to be determined.

This project couldn't exist without the prior work done by [vue-codemod](https://github.com/vuejs/vue-codemod). This repository started as a fork of `vue-codemod`. The decision to fork was made because:

- `vue-codemod` appears to be unmaintained since 2021
- `vue-codemod` supports both Vue 2 and Vue 3 whereas this project wants a smaller maintenance surface and only supports Vue 3
- This project targets the whole of SFC files, not just JavaScript
- `vue-codemod` ships and maintains transform scripts, whereas this project aims to provide a raw codemodding framework rather than pre-built codemods

## Command Line Usage

`npx vue-sfcmod <path> -t <transformation> --params [transformation params] [...additional options]`

- `transformation` (required) - path to a module exporting a transformation function (JS/TS only) or an object with three transformation functions (`script` key for JS/TS, `template` for HTML and `style` for CSS)
- `path` (required) - files or directory to transform.
- `--params` (optional) - additional parameters passed to the transformation function

## Programmatic API

- `runTransformation(fileInfo, transformation, params)`

## Roadmap

- [x] Basic testing setup and a dummy CLI
- [x] Support applying `jscodeshift` codemods to `.vue` files
- [x] Provide a programmatic interface for usage in `vue-cli-plugin-vue-next`
- [x] Set up tests
- [x] Built-in transformations need to support TypeScript
- [ ] Define an interface for transformation of template blocks ([`vue-eslint-parser`](https://github.com/mysticatea/vue-eslint-parser/) or [vue-template-ast-to-template](https://github.com/CommanderXL/vue-template-ast-to-template))
- [ ] Define an interface for transformation of style blocks (TBC)
- [x] A playground for writing transformations - `yarn playground` and visit http://localhost:3000

## Custom Transformation

See https://github.com/facebook/jscodeshift#transform-module

## Post Transformation

- Running transformations will generally ruin the formatting of your files. A recommended way to solve that problem is by using [Prettier](https://prettier.io/) or `eslint --fix`.
- Even after running prettier its possible to have unnecessary new lines added/removed. This can be solved by ignoring white spaces while staging the changes in git.

```sh
git diff --ignore-blank-lines | git apply --cached
```
