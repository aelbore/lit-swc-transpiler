import { expect } from '@qoi/test'

import { transformer } from '../transform'
import { inlinePropertyTransformer } from './property'

describe('property decorator', () => {

  const content = `
    import { LitElement, property  } from 'lit'

    class HelloWorld extends LitElement { 
    
      @property() message: string
      
    }  
  `

  it('shoule transform property to static get properties', () => {
    const output = transformer(content, './src/hello-world.ts', [ inlinePropertyTransformer() ])
    console.log(output)

  })

})