/* istanbul ignore file */
import { resolve } from 'path'

import { transformer } from './transform'
import { customElementTransformer } from './decorators/custom-elements'
import { inlinePropertyTransformer } from './decorators/property'
import { rewriteImportStylesTransformer } from './decorators/rewrite-import-styles'
import { LitCssOptions, transform } from './lit-css'

import { createFilter } from '@rollup/pluginutils'

export interface Options {
  enforce?: 'pre' | 'post'
  swcOptions?: import('@swc/core').Options
  litcss?: Omit<LitCssOptions, 'code' | 'id'>
}

export function inlineLitElement(options?: Options) {
  const filter = createFilter(/\.(ts|s?css|js)$/i)
  const cssFilter = createFilter(/\.(s?css)$/i)

  const plugins: import('@swc/core').Plugin[] = [
    inlinePropertyTransformer(),
    rewriteImportStylesTransformer(),
    customElementTransformer(),
  ]

  const plugin: import('rollup').Plugin = {
    name: 'inlineLitElement',
    load(id: string) {
      if (cssFilter(id)) this.addWatchFile(resolve(id))
      return null
    },
    transform(code: string, id: string) {
      if (!filter(id)) return null
      if (cssFilter(id)) return transform({ code, id, ...(options?.litcss || {}) })
      return transformer(code, id, plugins)
    },
    ...(options?.enforce 
      ? { enforce: options.enforce }
      : {}),
  }

  return plugin 
}

export * from './lit-css'