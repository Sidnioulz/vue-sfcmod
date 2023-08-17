import * as compilerSfc from '@vue/compiler-sfc'

// This file exists to re-export '@vue/compiler-sfc' named
// exports. This helps us centralise the place where we need
// to deal with Vue's odd packaging practices.
export const { compileTemplate, parse } = compilerSfc
