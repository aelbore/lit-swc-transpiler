import type { Module, Decorator, StringLiteral, Program, ClassDeclaration, CallExpression } from '@swc/core'
import Visitor from '@swc/core/Visitor'

import * as swc from 'swc-ast-helpers'

import { hasDecorator } from '../utils'

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

class CustomElementVisitor extends Visitor {
  visitModule(e: Module) {
    const moduleItem = e.body.find(content => swc.isClasDeclaration(content)) as ClassDeclaration
    const decorator = moduleItem.decorators.find(decorator => hasDecorator(decorator, 'customElement')) as Decorator

    e.body.forEach(content => {
      if (swc.isClasDeclaration(content)) {
        content.decorators = content.decorators.filter(decorator => {
          return (!(hasDecorator(decorator, 'customElement')))
        })
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