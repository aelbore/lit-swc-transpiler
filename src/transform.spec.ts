import { rollup, Plugin } from 'rollup'
import { join, resolve } from 'path'
import { minifyHTMLLiterals } from 'minify-html-literals'
import nodeResolve from '@rollup/plugin-node-resolve'
import mockfs from 'mock-fs'
import mock from 'mock-require'
import stringToTemplateLiteral from 'string-to-template-literal'

import { inlineLitElement } from './index'
import { getSass } from './lit-css'

describe('property decorator', () => {

  const build = async (input: string, plugins?: Plugin[]) => {
    const bundle = await rollup({
      input,
      external: [ 'lit', 'lit/decorators' ],
      plugins: [ 
        inlineLitElement({ enforce: 'pre', minifyHTMLLiterals: true }),
        ...(plugins || [])
      ]
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

  xit('shoule transform property to static get properties', async () => {
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

  xit('should transform with baseClass', async () => {
    const html = `
      <div class="bto--layout-header">
        <slot></slot>
      </div>
    `

    mockfs({
      './src/header.ts': `
        import { Props } from './base-class.ts'
        import './header.scss'

        export class LayoutHeader extends Props {
          render() {
            return html${stringToTemplateLiteral(html)}
          }
        } 

        customElements.define('bto-layout-header', LayoutHeader)      
      `,
      './src/base-class.ts': `
        export class Props extends LitElement {
          @property({ attribute: 'header-title' }) headerTitle: string
        
          next(_e: Event) {
            this.dispatchEvent(new CustomEvent('next'))
          }
        
          previous(_e: Event) {
            this.dispatchEvent(new CustomEvent('previous'))
          }
        }     
      `,
      './src/header.scss': `
        .bto--layout-header {
          height: 50px;
          width: var(--bto-layout-header, --bto-layout);
          border: 1px solid;
        }      
      `
    })

    const output = await build('./src/header.ts', [ nodeResolve() ])
    console.log(output.output[0].code)    
  })

  it('shoule transform property to static get properties and query decorator', async () => {
    mockfs({
      './button/button.ts': `
        import { LitElement } from 'lit'
        import { customElement, property } from 'lit/decorators'
        import './button.css'
        import '../themes.scss'

        @customElement('bto-element')
        export class HelloWorld extends LitElement { 
          @property() message: string
          @query('abc-menu') menu: HTMLElement
          @queryAll('.my-class-query') classQuery: HTMLElement
          
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

})