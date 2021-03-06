import { expect } from '@qoi/test'

import { transformer } from '@/transform'
import { rewriteImportStylesTransformer } from './rewrite-import-styles'

describe('property decorator', () => {

  const content = `
    import { LitElement, property  } from 'lit'
    import './styles.css'
    import '../styles.scss'

    class HelloWorld extends LitElement { 
    }
  `

  it('shoule rewrite import styles', () => {
    const output = transformer(content, './src/hello-world.ts', {
      transformers: [ rewriteImportStylesTransformer() ]
    })
    console.log(output)
  })

})