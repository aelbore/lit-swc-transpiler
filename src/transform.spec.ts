import { inlineLitElement } from './index'

import { rollup } from 'rollup'
import { litCss } from 'rollup-plugin-lit-css'

describe('property decorator', () => {

  const build = async () => {
    const bundle = await rollup({
      input: './fixtures/button.ts',
      external: [ 'lit', 'lit/decorators' ],
      plugins: [ litCss(), inlineLitElement() ]
    })

    const output = await bundle.generate({
      file: './dist/index.js',
      format: 'es'
    })

    return output
  }

  it('shoule transform property to static get properties', async () => {
    const output = await build()

    console.log(output.output[0].code)
  })
})