import Visitor from '@qoi/visitor/Visitor.js'
import { Program, Module, ImportDeclaration, ModuleItem } from '@swc/core'
import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import * as swc from 'swc-ast-helpers'

import { getClassDeclaration } from '@/utils'
import { getSass } from '@/lit-css'

const isImportStyle = (item: ModuleItem) => {
  return (swc.isImportDeclaration(item) 
    && (item.specifiers.length <= 0) 
    && (item.source.value.includes('.css') || item.source.value.includes('.scss')))
}

const getImportStyles = (file: string, items: ModuleItem[]) => {
  return items.reduce((prev, item) => {
    if (isImportStyle(item)) {
      const value = (item as ImportDeclaration).source.value
      const styleFullPath = resolve(dirname(file), value.replace(/'/g, '').replace(/"/g, ''))
      const content = value.includes('scss') ? getSass().compile(styleFullPath).css: readFileSync(styleFullPath, 'utf-8')
      prev.push(content)
    }
    return prev
  }, [] as string[])
}

const createTaggeTemplateExpression = (style: string) => {
  return swc.createTaggedTemplateExpression(
    swc.createIdentifer('css'),
    swc.createTemplateLiteral([ swc.createTemplateElement(style) ]))
}

const createStylesStatement = (element: string, elements: string[]) => {
  return swc.createExpressionStatement(
    swc.createAssingmentExpression(
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
  constructor(private tsFile: string) {
    super()
  }

  visitModule(e: Module) { 
    const moduleItem = getClassDeclaration(e.body)
    const styles = getImportStyles(this.tsFile, e.body)
    if (moduleItem && styles.length > 0) {
      const contents = e.body.filter(content => (!isImportStyle(content)))
      contents.push(createStylesStatement(moduleItem.identifier.value, styles))
      e.body = addCssImport(contents)
    }
    return e
  }
}

export function transpileStylesTransformer(file: string) {
  return (program: Program) => new TranspileStyles(file).visitProgram(program)
}