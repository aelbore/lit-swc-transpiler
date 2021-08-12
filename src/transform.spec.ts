import { expect } from '@qoi/test'

import { transformer } from './transform'
import { inlinePropertyTransformer } from './decorators/property'
import { customElementTransformer } from './decorators/custom-elements'
import { rewriteImportStylesTransformer } from './decorators/rewrite-import-styles'

describe('property decorator', () => {

  const html = 'html`<div>Hello ${this.message}</div>`' 

  const content = `
    import { LitElement, property, html  } from 'lit'
    import './styles.css'

    @customElement('hello-world')
    class HelloWorld extends LitElement { 
    
      @property() message: string
      @property({ type: Boolean }) disabled: boolean = false
      
      render() {
        return ${html}
      }
    }  
  `

  it('shoule transform property to static get properties', () => {
    const output = transformer(content, './src/hello-world.ts', [ 
      inlinePropertyTransformer(),
      rewriteImportStylesTransformer(),
      customElementTransformer(),
    ])

    console.log(output)

  })

})