export type PathKeyValue = {[key: string]: [string]}

export interface Options {
  enforce?: 'pre' | 'post'
  swcOptions?: import('@swc/core').Options
  litcss?: Omit<LitCssOptions, 'code' | 'id'>
  minifyHTMLLiterals?: boolean
  env?: 'development' | 'production'
  paths?: PathKeyValue
}

export interface Output {
  code: string
  map?: string | import('rollup').SourceMap
}

export interface LitCssOptions {
  code: string
  id: string
  specifier?: string
  tag?: string
}