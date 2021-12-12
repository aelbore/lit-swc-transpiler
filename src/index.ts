/* istanbul ignore file */
import { resolve, join } from 'path'
import { createFilter } from '@rollup/pluginutils'
import { createRequire } from 'module'

import { transformer } from './transform'
import { transform } from './lit-css'
import { Options, Output } from './types'
import { customElementTransformer, inlinePropertyTransformer, rewriteImportStylesTransformer, inlineQueryTransformer } from './decorators/decorators'

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

const transformLit = (code: string, id: string, options?: Options) => {
  return transformer(getContent(code, id, options || {}), id, [
    inlinePropertyTransformer(),
    inlineQueryTransformer(),
    rewriteImportStylesTransformer(),
    customElementTransformer()
  ])
}

export function inlineLitElement(options?: Options) {
  const filter = createFilter(/\.(ts|s?css|js)$/i)
  const cssFilter = createFilter(/\.(s?css)$/i)

  const plugin: import('rollup').Plugin = {
    name: 'inlineLitElement',
    load(id: string) {
      if (cssFilter(id)) this.addWatchFile(resolve(id))
      return null
    },
    transform(code: string, id: string) {
      if (!filter(id)) return null
      if (cssFilter(id)) return transformStyle(code, id, options)
      return transformLit(code, id, options)
    },
    ...(options?.enforce 
      ? { enforce: options.enforce }
      : {}),
  }

  return plugin 
}

export function viteLit() {
  const filter = createFilter(/\.(ts|js)$/i);
  const plugin: import('vite').Plugin = {
    name: 'vite-lit',
    enforce: 'pre',
    configureServer(server: import('vite').ViteDevServer) {
      server.watcher.on('change', (path: string) => {
        server.ws.send({ type: 'full-reload', path })
      })
    },
    transform(code: string, id: string) {
      if (!filter(id)) return null;
      return transformLit(code, id)
    }
  }
  return plugin
}

export * from './lit-css'