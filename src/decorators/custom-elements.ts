import type { Module, Decorator, StringLiteral, Program, CallExpression } from '@swc/core'
import Visitor from '@swc/core/Visitor.js'

import * as swc from 'swc-ast-helpers'

import { hasDecorator, getClassDeclaration } from '../utils'

const customElementStatement = (tag: string, element: string) => {
  return swc.createExpressionStatement(
    swc.createCallExpression(
      swc.createMemberExpression(swc.createIdentifer('customElements'), swc.createIdentifer('define')),
      [
        { expression: swc.createStringLiteral(tag) },
        { expression: swc.createIdentifer(element) }
      ]
    ))
}

const filterDecorators = (decorators: Decorator[]) => {
  return decorators.filter(decorator => (!(hasDecorator(decorator, 'customElement'))))
}

class CustomElementVisitor extends Visitor {
  visitModule(e: Module) {
    const moduleItem = getClassDeclaration(e.body)
    const decorator = moduleItem.decorators.find(decorator => hasDecorator(decorator, 'customElement')) as Decorator

    e.body.forEach(content => {
      if (swc.isExportDeclaration(content) && swc.isClasDeclaration(content.declaration)) {
        content.declaration.decorators = filterDecorators(content.declaration.decorators)
      }
      if (swc.isClasDeclaration(content)) {
        content.decorators = filterDecorators(content.decorators)
      }
    })

    const tag = (decorator.expression as CallExpression).arguments[0].expression as StringLiteral
    e.body.push(customElementStatement(tag.value, moduleItem.identifier.value))

    return e
  }
}

export function customElementTransformer() {
  return (program: Program) => new CustomElementVisitor().visitProgram(program)
}