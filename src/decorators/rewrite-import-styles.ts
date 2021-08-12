import type { ImportDeclaration, Program, Module, ExprOrSpread, ModuleItem, Identifier } from '@swc/core'
import Visitor from '@swc/core/Visitor.js'

import * as swc from 'swc-ast-helpers'

import { getClassDeclaration } from '../utils'

const removeQuotes = (value: string) => value.replace(/'/g, '').replace(/"/g, '')
const randomId = () => Math.random().toString(36).substring(2);

const hasStyles = (item: ModuleItem) => {
  return swc.isImportDeclaration(item) 
  && item.specifiers?.length < 1
  && removeQuotes(item.source.value).includes('.css')
}

const getStyles = (items: ModuleItem[]) => {
  return items.filter(content => hasStyles(content))
  .map((content: ImportDeclaration) => {
    const specifier = swc.createImportDefaultSpecifier(`styles${randomId()}`)
    return swc.updateImportDeclaration(content, content.source, [ specifier ])
  })
}

const createStylesStatement = (element: string, elements: Identifier[]) => {
  return swc.createExpressionStatement(
    swc.createAssingmentExpression(
      swc.createMemberExpression(swc.createIdentifer(element), swc.createIdentifer('styles')),
      swc.createArrayExpression(elements.map(el => ({ expression: el } as ExprOrSpread)))
    )
  )
}

class RewrieImportStyles extends Visitor {
  visitModule(e: Module) {
    const moduleItem = getClassDeclaration(e.body)

    const styles = getStyles(e.body)
    const imports = [ ...styles, ...e.body.filter(content => (!(hasStyles(content)) && swc.isImportDeclaration(content))) ]

    const contents = e.body.filter(content => (!(swc.isImportDeclaration(content))))
    imports.forEach(value => {
      contents.unshift((value as ModuleItem))
    })
    
    const elements = styles.map(style => swc.createIdentifer(style.specifiers[0].local.value))
    contents.push(createStylesStatement(moduleItem.identifier.value, elements))

    e.body = contents

    return e
  }
}

export function rewriteImportStylesTransformer() {
  return (program: Program) => new RewrieImportStyles().visitProgram(program)
}