import type { Decorator } from '@swc/core'

import type { ModuleItem, ExportDeclaration, ClassDeclaration } from '@swc/core'

import * as swc from 'swc-ast-helpers'

export function hasDecorator(decorator: Decorator, text: string){
  return swc.isDecorator(decorator) 
    && swc.isCallExpression(decorator.expression)
    && swc.isIdentifer(decorator.expression.callee)
    && decorator.expression.callee.value.includes(text)
}

export function isClasDeclaration(content: ModuleItem){
  return swc.isClasDeclaration(content)
    && swc.isIdentifer(content.superClass)
    && (content.superClass.value.includes('LitElement') || content.superClass.value.includes('HTMLElement'))
}

export function getClassDeclaration(items: ModuleItem[]) {
  const exportDeclaration = items.find(content => swc.isExportDeclaration(content) && isClasDeclaration(content.declaration))
  return (
    exportDeclaration
      ? (exportDeclaration as ExportDeclaration).declaration
      : items.find(content => isClasDeclaration(content))
  ) as ClassDeclaration
}