import type { SfcmodConfig } from 'vue-sfcmod'

const config: SfcmodConfig = {
  // Presets define the paths where we can look for predefined transformation
  // modules. When `-t` is omitted, the end user is asked to choose from the
  // list of presets.
  presets: [
    // With a basic glob.
    './examples/**/transformation.cjs',

    // With object presets.
    {
      glob: './examples/**/transformation.cjs',
      name: (filePath: string) =>
        filePath
          .replace(/\/transformation.cjs$/, '')
          .split('/')
          .slice(-1)[0],
    },
  ],
}

export default config
