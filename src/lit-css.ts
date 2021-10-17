import { extname, resolve, join } from 'path'
import { createRequire } from 'module'

import stringToTemplateLiteral from 'string-to-template-literal'
import { LitCssOptions } from './types'

function sassToCss(data: string, file: string) {
  const css = getSass().renderSync({ data, file }).css
  return css.toString('utf-8')
}

export function getSass() {
  const sassPath = join(resolve('node_modules'), 'sass', 'sass.default.dart.js')
  return createRequire(sassPath)(sassPath)
}

export function transform({ code, id, specifier = 'lit', tag = 'css' }: LitCssOptions) {
  const content = extname(id).includes('.css') ? code: sassToCss(code, id)

  const styles = `import {${tag}} from '${specifier}';
  export const styles = ${tag}${stringToTemplateLiteral(content)};
  export default styles;`
  
  return { code: styles, map: { mappings: '' } } as import('rollup').TransformResult
}