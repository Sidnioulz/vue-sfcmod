# vue-sfcmod

![Status: Experimental](https://img.shields.io/badge/status-experimental-thistle) ![GitHub last commit](https://img.shields.io/github/last-commit/Sidnioulz/vue-sfcmod/main) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Sidnioulz/vue-sfcmod) [![Continuous Integration](https://github.com/Sidnioulz/vue-sfcmod/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/Sidnioulz/vue-sfcmod/actions/workflows/continuous-integration.yml) ![npm](https://img.shields.io/npm/v/vue-sfcmod)

`vue-sfcmod` is a framework for codemodding Vue 3 Single-File Components. It aims to support `<script>` codemods for both JavaScript and TypeScript with [JSCodeshift](https://github.com/facebook/jscodeshift), `<template>` codemods with the [Vue compiler](https://github.com/vuejs/core/tree/main/packages/compiler-sfc) and `<style>` codemods with tools to be determined.

This project couldn't exist without the prior work done by [vue-codemod](https://github.com/vuejs/vue-codemod). This repository started as a fork of `vue-codemod`. The decision to fork was made because:

- `vue-codemod` appears to be unmaintained since 2021
- `vue-codemod` supports both Vue 2 and Vue 3 whereas this project wants a smaller maintenance surface and only supports Vue 3
- This project targets the whole of SFC files, not just JavaScript
- `vue-codemod` ships and maintains transform scripts, whereas this project aims to provide a raw codemodding framework rather than pre-built codemods

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

## Roadmap

- [x] Basic testing setup and a dummy CLI
- [x] Support applying `jscodeshift` codemods to `.vue` files
- [x] TypeScript support
- [x] `<script setup>` support
- [ ] Branch test coverage above 80%
- [ ] `<template>` support ([`vue-eslint-parser`](https://github.com/mysticatea/vue-eslint-parser/) or [vue-template-ast-to-template](https://github.com/CommanderXL/vue-template-ast-to-template))
- [ ] `<style>` support
- [ ] Working examples

## Javascript/Typescript transformation

See https://github.com/facebook/jscodeshift#transform-module

## Post Transformation

Running transformations will generally ruin the formatting of your files. A recommended way to solve that problem is by using [Prettier](https://prettier.io/) or `eslint --fix`.
