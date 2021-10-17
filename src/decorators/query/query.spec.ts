import { transformer } from '@/transform'
import { inlineQueryTransformer } from './query'

describe('query decorator', () => {

  const content = `
    import { LitElement, property  } from 'lit'

    export class HelloWorld extends LitElement { 
    
      @query('abc-menu') menu: HTMLELement
      @queryAll('abc-all') all: HTMLELement

    }  
  `

  it('shoule transform property to static get properties', () => {
    const output = transformer(content, './src/hello-world.ts', [ inlineQueryTransformer() ])
    console.log(output)
  })

})