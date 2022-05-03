import { Program, Module, ImportDeclaration, ModuleItem } from '@swc/core'
import { resolve, dirname } from 'path'
import { existsSync, readFileSync } from 'fs'
import * as swc from 'swc-ast-helpers'

import { getClassDeclaration } from '@/utils'
import { getSass } from '@/lit-css'
import { PathKeyValue } from '@/types'

import Visitor from '@swc/core/Visitor.js'

const isImportStyle = (item: ModuleItem) => {
  return (swc.isImportDeclaration(item) 
    && (item.specifiers.length <= 0) 
    && (item.source.value.includes('.css') || item.source.value.includes('.scss')))
}

const getStyleFullPath = (path: string, file: string, paths: PathKeyValue = {}) => {
  for (const result of Object.keys(paths)) {
    const value = paths[result].find(o => result.includes(path) && existsSync(o))
    if (value) {
      return value
    }
  }
  return resolve(dirname(file), path.replace(/'/g, '').replace(/"/g, ''))
}

const getImportStyles = (file: string, items: ModuleItem[], paths?: PathKeyValue) => {
  return items.reduce((prev, item) => {
    if (isImportStyle(item)) {
      const value = (item as ImportDeclaration).source.value
      const styleFullPath = getStyleFullPath(value, file, paths)
      const content = value.includes('scss') ? getSass().compile(styleFullPath).css: readFileSync(styleFullPath, 'utf-8')
      prev.push(content)
    }
    return prev
  }, [])
}

const createTaggeTemplateExpression = (style: string) => {
  return swc.createTaggedTemplateExpression(
    swc.createIdentifer('css'),
    swc.createTemplateLiteral([ swc.createTemplateElement(style, true) ]))
}

const createStylesStatement = (element: string, elements: string[]) => {
  return swc.createExpressionStatement(
    swc.createAssignmentExpression(
      swc.createMemberExpression(swc.createIdentifer(element), swc.createIdentifer('styles')),
      swc.createArrayExpression(
        elements.reverse().map(element =>
          ({ spread: null, expression: createTaggeTemplateExpression(element) })
        ))
    ))
}

const addCssImport = (items: ModuleItem[]) => {
  for (const item of items) {
    if (swc.isImportDeclaration(item) && item.source.value.includes('lit')) {
      item.specifiers.push(swc.createImportSpecifier('css'))
      break
    }
  }
  return items
}

class TranspileStyles extends Visitor {
  constructor(private tsFile: string, private paths?: PathKeyValue) {
    super()
  }
  visitModule(e: Module) { 
    const moduleItem = getClassDeclaration(e.body)
    const styles = getImportStyles(this.tsFile, e.body, this.paths)
    if (moduleItem && styles.length > 0) {
      const contents = e.body.filter(content => (!isImportStyle(content)))
      contents.push(createStylesStatement(moduleItem.identifier.value, styles))
      e.body = addCssImport(contents)
    }
    return e
  }
}

export function transpileStylesTransformer(file: string, paths?: PathKeyValue) {
  return (program: Program) => new TranspileStyles(file, paths).visitProgram(program)
}