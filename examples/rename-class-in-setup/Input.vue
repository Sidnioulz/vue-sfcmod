<template>
  <div :class="containerClassNames">
    <blockquote :class="quoteClassNames">
      <IconQuote size="medium" />
      and when we speak we are afraid
      <br />
      our words will not be heard
      <br />
      nor welcomed
      <br />
      but when we are silent
      <br />
      we are still afraid
      <br />
      So it is better to speak
      <br />
      remembering
      <br />
      we were never meant to survive
    </blockquote>
    <footer>
      ― Audre Lorde,
      <cite> The Black Unicorn: Poems </cite>
    </footer>
    <button type="button">Share poem</button>
  </div>
</template>

<script lang="ts" setup>
import { tw } from 'some-tailwind-helper'

defineOptions({
  name: 'PoemHighlight',
})

const containerClassNames = tw`flex-1 min-h-4 w-6`
const quoteClassNames = tw`p-[2.5rem]`
</script>
