import * as fc from 'fast-check'
import { ZodFastCheck } from 'zod-fast-check'

import { ConfigSchema, isValidConfig } from '../config.schema'

describe('schemas', () => {
  describe('config', () => {
    const fcConfig = ZodFastCheck().inputOf(ConfigSchema)

    it('isValidConfig returns true for valid configs', () => {
      fc.assert(
        fc.property(fcConfig, (config) => {
          expect(isValidConfig(config)).toBe(true)
        }),
      )
    })

    it('isValidConfig returns false for nullish configs', () => {
      fc.assert(
        fc.property(fc.falsy(), (config) => {
          expect(isValidConfig(config)).toBe(false)
        }),
      )
    })
  })
})
