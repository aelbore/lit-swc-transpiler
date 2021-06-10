import { transformer } from './transform'
import { customElementTransformer } from './decorators/custom-elements'

export interface Options {
  enforce?: 'pre' | 'post'
  swcOptions?: import('@swc/core').Options
}

export function inlineLitElement(options?: Options) {
  const plugins: import('@swc/core').Plugin[] = [
    customElementTransformer()
  ]
  return {
    name: 'inlineLitElement',
    transform(code: string, id: string) {
      if (id.includes('node_modules')) return null
      return transformer(code, id, plugins)
    },
    ...(options?.enforce 
      ? { enforce: options.enforce }
      : {}),
  }
}