<template>
  <div class="flex-1 min-h-4 w-6">
    <blockquote class="p-[2.5rem]">
      <IconQuote size="medium" />
      and when we speak we are afraid<br />
      our words will not be heard<br />
      nor welcomed<br />
      but when we are silent<br />
      we are still afraid<br />
      So it is better to speak<br />
      remembering<br />
      we were never meant to survive
    </blockquote>
    <footer>― Audre Lorde, <cite>The Black Unicorn: Poems</cite></footer>
    <Button>Share poem</Button>
  </div>
</template>

<script lang="ts">
import { Button, IconQuote } from '@orgname/old-package'
export default {
  components: {
    Button,
    IconQuote,
  },
}
</script>
