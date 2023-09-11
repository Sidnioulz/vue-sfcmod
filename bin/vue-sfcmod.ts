#!/usr/bin/env node

import { main } from '~/bin'

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
