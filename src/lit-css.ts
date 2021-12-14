import { extname, resolve, join } from 'path'
import { createRequire } from 'module'

import stringToTemplateLiteral from 'string-to-template-literal'
import { LitCssOptions } from './types'
import type { Options, CompileResult, StringOptions } from 'sass'

export interface Sass {
  compile(path: string, options?: Options<'sync'>): CompileResult
  compileString(source: string, options?: StringOptions<'sync'>): CompileResult
}

function sassToCss(data: string) {
  const sass = getSass().compileString(data)
  return sass.css
}

export function getSass() {
  const sassPath = join(resolve('node_modules'), 'sass', 'sass.default.dart.js')
  return createRequire(sassPath)(sassPath) as Sass
}

export function transform({ code, id, specifier = 'lit', tag = 'css' }: LitCssOptions) {
  const content = extname(id).includes('.css') ? code: sassToCss(code)

  const styles = `import {${tag}} from '${specifier}';
  export const styles = ${tag}${stringToTemplateLiteral(content)};
  export default styles;`
  
  return { code: styles, map: { mappings: '' } } as import('rollup').TransformResult
}