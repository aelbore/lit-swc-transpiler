import { extname } from 'path'
import { createRequire } from 'module'

import stringToTemplateLiteral from 'string-to-template-literal'

export interface LitCssOptions {
  code: string
  id: string
  specifier?: string
  tag?: string
}

function sassToCss(code: string, id: string) {
  const { default: sass } = createRequire('file://')('sass')
  const css = sass.renderSync({ data: code, file: id  }).css
  return css.toString('utf-8')
}

export function transform({ code, id, specifier = 'lit', tag = 'css' }: LitCssOptions) {
  const content = extname(id).includes('.css') ? code: sassToCss(code, id)

  const styles = `import {${tag}} from '${specifier}';
  export const styles = ${tag}${stringToTemplateLiteral(content)};
  export default styles;`
  
  return { code: styles, map: { mappings: '' } } as import('rollup').TransformResult
}