
import { transformer } from '../transform'
import { customElementTransformer } from './custom-elements'

describe('CustomElementPlugin', () => {

  it('should remove customElement decorator', () => {
    const content = `
      import { LitElement  } from 'lit'

      @customElement('hello-world')
      class HelloWorld extends LitElement { }
    `

    const output = transformer(content, 
      './src/hello-world.ts', 
      [
        customElementTransformer()
      ])

    console.log(output)

  })

})