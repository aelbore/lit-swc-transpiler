/* istanbul ignore file */
import { resolve } from 'path'

import { transformer } from './transform'
import { customElementTransformer } from './decorators/custom-elements'
import { inlinePropertyTransformer } from './decorators/property'
import { rewriteImportStylesTransformer } from './decorators/rewrite-import-styles'

export interface Options {
  enforce?: 'pre' | 'post'
  swcOptions?: import('@swc/core').Options
}

export function inlineLitElement(options?: Options) {
  const plugins: import('@swc/core').Plugin[] = [
    inlinePropertyTransformer(),
    rewriteImportStylesTransformer(),
    customElementTransformer(),
  ]
  const plugin: import('rollup').Plugin = {
    name: 'inlineLitElement',
    load(id: string) {
      if (id.includes('.css') || id.includes('.scss')) this.addWatchFile(resolve(id)) 
      return null     
    },
    transform(code: string, id: string) {
      if (id.includes('node_modules')) return null
      return transformer(code, id, plugins)
    },
    ...(options?.enforce 
      ? { enforce: options.enforce }
      : {}),
  }
  return plugin 
}