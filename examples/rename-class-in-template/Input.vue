<template>
  <div class="flex-1 min-h-4 w-6">
    <blockquote class="p-8 rounded-2">
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
defineOptions({
  name: 'PoemHighlight',
})
</script>
