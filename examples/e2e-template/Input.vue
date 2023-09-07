<template>
  <div :class="containerClassNames">
    <QuoteHeader> {{ slotProps.a }} {{ slotProps.b }} </QuoteHeader>
    <blockquote :class="quoteClassNames">
      <component :is="icon" size="medium" />
      <slot foo="bar"> Missing quote </slot>
    </blockquote>
    <footer>
      ― {{ author }}

      <slot name="extras" />
      <hr />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import type { Component, VNode } from 'vue'
import { tw } from 'some-tailwind-helper'
import { IconQuote, QuoteHeader } from 'some-library'

withDefaults(defineProps<{
  author?: string
  hasShare?: boolean
  hasElaborateShare?: boolean
  icon?: Component
  origin?: string
  onShare?: (e: Event) => void
}>(), {
  author: 'anonymous',
  hasShare: true,
  hasElaborateShare: false,
  icon: IconQuote,
  onShare: () => void
})

defineSlots<{
  default: (props: { foo: string }) => VNode | Component | string
  extras: () => VNode | Component | string
}>()

defineOptions({
  name: 'PoemHighlight',
})

const containerClassNames = tw`flex-1 min-h-4 w-6`
const quoteClassNames = tw`p-10`
const elaborateClassNames = tw`pt-8 p-4`
</script>
