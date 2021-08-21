import { rollup } from 'rollup'
import { join, resolve } from 'path'
import { minifyHTMLLiterals } from 'minify-html-literals'
import mockfs from 'mock-fs'
import mock from 'mock-require'
import stringToTemplateLiteral from 'string-to-template-literal'

import { inlineLitElement } from './index'
import { getSass } from './lit-css'

describe('property decorator', () => {

  const build = async (input: string) => {
    const bundle = await rollup({
      input,
      external: [ 'lit', 'lit/decorators' ],
      plugins: [ inlineLitElement({ minifyHTMLLiterals: true }) ]
    })
    const output = await bundle.generate({
      file: './dist/index.js',
      format: 'es'
    })
    return output
  }

  before(() => {
    const sassPath = join(resolve(), 'node_modules', 'sass', 'sass.dart.js')
    
    mock(sassPath, getSass())
    mock(join(resolve('node_modules'), 'minify-html-literals'), { minifyHTMLLiterals })
  })

  after(() => {
    mock.stopAll()
  })

  afterEach(() => {
    mockfs.restore()
  })

  it('shoule transform property to static get properties', async () => {
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

    const output = await build('./button/button.ts')

    console.log(output.output[0].code)
  })

  xit('should transform without decorators', async () => {
    const css = `
      .bto--layout-header {
        height: 50px;
        width: var(--bto-layout-header, --bto-layout);
        border: 1px solid;
      }
    `
    const html = `
      <div class="bto--layout-header">
        <slot></slot>
      </div>
    `

    mockfs({
      './src/header.ts': `
        import { LitElement, html, css } from 'lit'

        class LayoutHeader extends LitElement {
          static styles = css${stringToTemplateLiteral(css)}
          render() {
            return html${stringToTemplateLiteral(html)}
          }
        } 

        customElements.define('bto-layout-header', LayoutHeader)      
      `
    })
    const output = await build('./src/header.ts')

    console.log(output.output[0].code)
  })

  xit('should transform without decorators with import styles', async () => {
    const html = `
      <div class="bto--layout-header">
        <slot></slot>
      </div>
    `

    mockfs({
      './src/header.ts': `
        import { LitElement, html } from 'lit'
        import './header.scss'

        class LayoutHeader extends LitElement {
          render() {
            return html${stringToTemplateLiteral(html)}
          }
        } 

        customElements.define('bto-layout-header', LayoutHeader)      
      `,
      './src/header.scss': `
        .bto--layout-header {
          height: 50px;
          width: var(--bto-layout-header, --bto-layout);
          border: 1px solid;
        }      
      `
    })

    const output = await build('./src/header.ts')
    console.log(output.output[0].code)
  })

  xit('should transform with HTMLElement styles', async() => {
    const html = `
      <div class="bto--layout-header">
        <slot></slot>
      </div>
    `

    mockfs({
      './src/header.ts': `
        import './header.scss'

        class LayoutHeader extends HTMLElement {
          render() {
            return html${stringToTemplateLiteral(html)}
          }
        } 

        customElements.define('bto-layout-header', LayoutHeader)      
      `,
      './src/header.scss': `
        .bto--layout-header {
          height: 50px;
          width: var(--bto-layout-header, --bto-layout);
          border: 1px solid;
        }      
      `
    })

    const output = await build('./src/header.ts')
    console.log(output.output[0].code)    
  })

})