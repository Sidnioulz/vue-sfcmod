<template>
  <div class="flex-1 min-h-4 w-6">
    <blockquote class="p-[2.5rem]">
      <IconHeart size="medium" />
      This is a quote.
    </blockquote>
    <RevButton variant="primary">Click me</RevButton>
  </div>
</template>

<script>
import { RevButton, IconHeart } from '@backmarket/design-system'
export default {
  components: {
    RevButton,
    IconHeart,
  },
}
</script>
