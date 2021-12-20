import mockfs from 'mock-fs'
import { Plugin, rollup } from 'rollup'
import { createFilter } from '@rollup/pluginutils'
import { expect } from '@qoi/test'
import mock from 'mock-require'

import { transformer } from '@/transform'
import { transpileStylesTransformer } from './transpile'
import { join, resolve } from 'path'
import { getSass } from '@/lit-css'

describe('transpileStylesTransformer', () => {
  const pluginLit = () => {
    const filter = createFilter(/\.(ts|s?css|js)$/i)
    return {
      name: 'lit-plugin',
      transform(code: string, id: string) {
        if (!filter(id)) return null
        return transformer(code, id, {
          paths: { '@/base.scss': [ './base.scss' ] },
          transformers: [ 
            transpileStylesTransformer(id, {
              '@/base.scss': [ './base.scss' ]
            }) 
          ]
        })
      }
    } as Plugin
  }

  const build = async (input: string) => {
    const bundle = await rollup({
      input,
      external: [ 'lit', 'lit/decorators' ],
      plugins: [ pluginLit() ]
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
  })

  xit('should transpile css styles', async () => {
    mockfs({
      './src/index.ts': `
        import { LitElement, property } from 'lit'
        import '../base.css'
        import './styles.css'
    
        export class HelloWorld extends LitElement { 
        }     
      `,
      './src/styles.css': `
        h1 {
          color: red
        }
      `,
      './base.css': `
        h1, h2 {
          margin: 0;
          padding: 0;
        }
      `
    })

    const output = await build('./src/index.ts')
    console.log(output.output[0].code)
  })

  xit('should transpile scss styles', async () => {
    mockfs({
      './src/index.ts': `
        import { LitElement, property } from 'lit'
        import '../base.scss'
        import './styles.scss'
    
        export class HelloWorld extends LitElement { 
        }     
      `,
      './src/styles.scss': `
        :host {
          h1 {
            color: red
          }
        }
      `,
      './base.scss': `
        h1, h2 {
          margin: 0;
          padding: 0;
        }
      `
    })

    const output = await build('./src/index.ts')
    console.log(output.output[0].code)
  })

  it('should transpile scss styles using paths', async () => {
    mockfs({
      './src/index.ts': `
        import { LitElement, property } from 'lit'
        import '@/base.scss'
        import './styles.scss'
    
        export class HelloWorld extends LitElement { 
        }     
      `,
      './src/styles.scss': `
        :host {
          h1 {
            color: red
          }
        }
      `,
      './base.scss': `
        h1, h2 {
          margin: 0;
          padding: 0;
        }
      `
    })

    const output = await build('./src/index.ts')
    console.log(output.output[0].code)
  })


})