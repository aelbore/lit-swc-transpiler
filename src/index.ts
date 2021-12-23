/* istanbul ignore file */
import { resolve, join } from 'path'
import { createFilter } from '@rollup/pluginutils'
import { createRequire } from 'module'

import { transformer } from './transform'
import { transform } from './lit-css'
import { Options, Output } from './types'
import { transpileStylesTransformer } from './styles/transpile'
import { customElementTransformer, inlinePropertyTransformer, rewriteImportStylesTransformer, inlineQueryTransformer } from './decorators/decorators'

const commonPlugins = () => [
  inlineQueryTransformer(),
  rewriteImportStylesTransformer(),
  customElementTransformer()
]

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

  const plugin: import('rollup').Plugin = {
    name: 'inlineLitElement',
    load(id: string) {
      if (cssFilter(id)) this.addWatchFile(resolve(id))
      return null
    },
    transform(code: string, id: string) {
      if (!filter(id)) return null
      if (cssFilter(id)) return transformStyle(code, id, options)
      return transformer(getContent(code, id, options || {}), id, {
        transformers: [ inlinePropertyTransformer(), ...commonPlugins() ]
      })
    },
    ...(options?.enforce 
      ? { enforce: options.enforce }
      : {}),
  }

  return plugin 
}

export function viteLit(options?: Options) {
  const { env = 'development' } = options
  const filter = createFilter(/\.(ts|js)$/i, /node_modules/)
  const plugin: import('vite').Plugin = {
    name: 'vite-lit',
    enforce: 'pre',
    configureServer({ watcher, ws }: import('vite').ViteDevServer) {
      watcher.on('change', (path: string) => {
        ws.send({ type: 'full-reload', path })
      })
    },
    transform(code: string, id: string) {
      if (!filter(id)) return null;      
      return transformer(getContent(code, id, options || {}), id, {
        paths: options?.paths,
        transformers: [
          ...(env.includes('development') 
            ? [ rewriteImportStylesTransformer() ]
            : [ transpileStylesTransformer(id, options?.paths) ]),
          ...commonPlugins()
        ]
      })
    }
  }
  return plugin
}

export * from './lit-css'