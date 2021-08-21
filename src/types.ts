export interface Options {
  enforce?: 'pre' | 'post'
  swcOptions?: import('@swc/core').Options
  litcss?: Omit<LitCssOptions, 'code' | 'id'>
  minifyHTMLLiterals?: boolean
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