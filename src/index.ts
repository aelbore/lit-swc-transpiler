/* istanbul ignore file */
import { resolve, join } from 'path'
import { createFilter } from '@rollup/pluginutils'
import { createRequire } from 'module'

import { transformer } from './transform'
import { customElementTransformer } from './decorators/custom-elements'
import { inlinePropertyTransformer } from './decorators/property'
import { rewriteImportStylesTransformer } from './decorators/rewrite-import-styles'
import { transform } from './lit-css'
import { Options, Output } from './types'

const getMinifyHTMLLiterals = () => {
  const htmlLiterals = join(resolve('node_modules'), 'minify-html-literals')
  const { minifyHTMLLiterals } = createRequire(htmlLiterals)(htmlLiterals)
  return minifyHTMLLiterals
}

const transformStyle = (code: string, id: string, options?: Options) => {
  const style = transform({ code, id, ...(options?.litcss || {}) }) as Output
  if (options?.minifyHTMLLiterals) {
    const minifyHTMLLiterals = getMinifyHTMLLiterals()
    return minifyHTMLLiterals!(style.code, { fileName: id })
  }
  return style
}

const getContent = (code: string, id: string, options?: Options) => {
  if (options?.minifyHTMLLiterals) {
    const minifyHTMLLiterals = getMinifyHTMLLiterals()
    return minifyHTMLLiterals(code, { fileName: id })?.code ?? code
  }
  return code
}

export function inlineLitElement(options?: Options) {
  const filter = createFilter(/\.(ts|s?css|js)$/i)
  const cssFilter = createFilter(/\.(s?css)$/i)

  const plugins: import('@swc/core').Plugin[] = [
    inlinePropertyTransformer(),
    rewriteImportStylesTransformer(),
    customElementTransformer()
  ]

  const plugin: import('rollup').Plugin = {
    name: 'inlineLitElement',
    load(id: string) {
      if (cssFilter(id)) this.addWatchFile(resolve(id))
      return null
    },
    transform(code: string, id: string) {
      if (!filter(id)) return null
      if (cssFilter(id)) return transformStyle(code, id, options)
      return transformer(getContent(code, id, options), id, plugins)
    },
    ...(options?.enforce 
      ? { enforce: options.enforce }
      : {}),
  }

  return plugin 
}

export * from './lit-css'