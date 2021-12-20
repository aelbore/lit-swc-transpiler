/* istanbul ignore file */
import { transformSync, plugins, Plugin } from '@swc/core'

export interface TransformerOptions  {
  transformers?: Plugin[]
  paths?: {[key: string]: [string]}
}

export function transformer(code: string, id: string, options?: TransformerOptions) {
  return transformSync(code, {
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: true,
        dynamicImport: true,
        tsx: true
      },
      target: 'es2020',
      baseUrl: '.',
      paths: options?.paths || {}
    },
    filename: id,
    sourceMaps: true,
    isModule: true,
    plugin: plugins(options?.transformers || [])
  })
}