import { z } from 'zod'

export const ConfigSchema = z.object({
  presets: z.array(
    z.union([
      z.string(),
      z.object({
        glob: z.string(),
        name: z.function({
          input: [z.string()],
          output: z.string(),
        }),
      }),
    ]),
  ),
})

export type Config = z.infer<typeof ConfigSchema>

export function isValidConfig(input: unknown): input is Config {
  if (input) {
    return ConfigSchema.safeParse(input).success
  }

  return false
}
