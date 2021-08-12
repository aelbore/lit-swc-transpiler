/* istanbul ignore file */

import { transformer } from './transform'
import { customElementTransformer } from './decorators/custom-elements'
import { inlinePropertyTransformer } from './decorators/property'
import { rewriteImportStylesTransformer } from './decorators/rewrite-import-styles'

import { createFilter } from '@rollup/pluginutils'

export interface Options {
  enforce?: 'pre' | 'post'
  swcOptions?: import('@swc/core').Options
}

export function inlineLitElement(options?: Options) {
  const filter = createFilter(/\.ts$/i, /\.css$/i);
  
  const plugins: import('@swc/core').Plugin[] = [
    inlinePropertyTransformer(),
    rewriteImportStylesTransformer(),
    customElementTransformer(),
  ]
  const plugin: import('rollup').Plugin = {
    name: 'inlineLitElement',
    transform(code: string, id: string) {
      if (!filter(id)) return null
      return transformer(code, id, plugins)
    },
    ...(options?.enforce 
      ? { enforce: options.enforce }
      : {}),
  }
  return plugin 
}