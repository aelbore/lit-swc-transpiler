/* istanbul ignore file */
import { transformSync, plugins, Plugin } from '@swc/core'

/* istanbul ignore next */
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
    plugin: plugins(transformers || [])
  })
}