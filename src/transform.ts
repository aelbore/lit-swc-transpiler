/* istanbul ignore file */
import { transformSync, plugins, Plugin } from '@swc/core'

export function transformer(code: string, 
  id: string, 
  transformers?: Plugin[]
) {
  return transformSync(code, {
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: true,
        dynamicImport: true,
        tsx: true
      },
      target: 'es2020'
    },
    filename: id,
    sourceMaps: true,
    isModule: true,
    plugin: plugins(transformers || [])
  })
}