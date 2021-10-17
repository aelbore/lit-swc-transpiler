import type { Decorator, Module, StringLiteral, ClassProperty, Identifier, ClassMember, Program, CallExpression } from '@swc/core'

import Visitor from '@swc/visitor/Visitor.js'
import { hasDecorator, isClasDeclaration, getClassDeclaration, updateMembers } from '@/utils'

import * as swc from 'swc-ast-helpers'

export enum Query {
  query = 'querySelector',
  queryAll = 'querySelectorAll'
}

const hasQueryState = (member: ClassMember, key: string) => 
  swc.isClassProperty(member) && member.decorators.find(decorator => hasDecorator(decorator, key))

const createQueryGetters = (members: ClassMember[]) => {
  return members.map((member: ClassProperty) => {
    const expression = ((member.decorators[0] as Decorator)?.expression as CallExpression).arguments?.[0]?.expression as StringLiteral
    const shadowRoot = swc.createMemberExpression(swc.createThisExpression(), swc.createIdentifer('shadowRoot'))
    const value = (((member.decorators[0] as Decorator)?.expression as CallExpression)?.callee as Identifier)?.value
    return swc.createGetter(member.key as Identifier, swc.createBlockStatement([
      swc.createReturnStatement(
        swc.createCallExpression(
          swc.createMemberExpression(shadowRoot, swc.createIdentifer(Query[value])),
          [
            { spread: null, expression }
          ]
        )
      )
    ]))
  })
}

class QueryDecorator extends Visitor {
  visitModule(e: Module) {
    const moduleItem = getClassDeclaration(e.body)

    if (moduleItem) {
      const members = moduleItem.body.filter(member => {
        return hasQueryState(member, 'query') || hasQueryState(member, 'queryAll')
      })
      if (members.length > 0) {
        const toUpdateMember = () => updateMembers(moduleItem.body, ['query', 'queryAll'])
        const getters = createQueryGetters(members)
        getters.forEach(getter => moduleItem.body.push(getter))
        e.body.forEach(content => {
          if (swc.isClasDeclaration(content) && isClasDeclaration(content)) {
            content.body = toUpdateMember()
          }
          if (swc.isExportDeclaration(content) && swc.isClasDeclaration(content.declaration) && isClasDeclaration(content.declaration)) {
            content.declaration.body = toUpdateMember()
          }
        })
      }
    }

    return e
  }
}

export function inlineQueryTransformer() {
  return (program: Program) => new QueryDecorator().visitProgram(program)
}