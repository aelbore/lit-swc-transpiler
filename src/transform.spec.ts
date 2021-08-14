import { rollup } from 'rollup'
import { join, resolve } from 'path'
import mockfs from 'mock-fs'
import mock from 'mock-require'
import stringToTemplateLiteral from 'string-to-template-literal'

import { inlineLitElement } from './index'
import { getSass } from './lit-css'

describe('property decorator', () => {

  before(() => {
    const sassPath = join(resolve(), 'node_modules', 'sass', 'sass.dart.js')
    mock(sassPath, getSass())

    mockfs({
      './button/button.ts': `
        import { LitElement } from 'lit'
        import { customElement, property } from 'lit/decorators'
        import './button.css'
        import '../themes.scss'

        @customElement('bto-element')
        export class HelloWorld extends LitElement { 
          @property() message: string
          
          render() {
            return html ${stringToTemplateLiteral('<p>Hello ${this.message}</p>')} 
          }
        }          
      `,
      './button/button.css': `p { color: red; }`,
      './themes.scss': `
        p {
          span {
            color: blue;
          }
        }
      `
    })
  })

  after(() => {
    mockfs.restore()
  })

  const build = async () => {
    const bundle = await rollup({
      input: './button/button.ts',
      external: [ 'lit', 'lit/decorators' ],
      plugins: [ inlineLitElement() ]
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