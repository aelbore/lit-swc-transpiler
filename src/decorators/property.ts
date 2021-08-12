import type { Decorator, Module, ObjectExpression, ClassProperty, Identifier, ClassMember, Program, CallExpression, ClassDeclaration, KeyValueProperty } from '@swc/core'
import Visitor from '@swc/core/Visitor'

import * as swc from 'swc-ast-helpers'
import { hasDecorator } from '../utils'

const hasMemberProperty = (member: ClassMember) => 
  swc.isClassProperty(member) && member.decorators.find(decorator => hasDecorator(decorator, 'property'))

const createProperties = (members: ClassMember[]) => {
  return members  
    .filter(member => hasMemberProperty(member))
    .map((member: ClassProperty) => {
      const args = ((member.decorators[0] as Decorator).expression as CallExpression).arguments?.[0]?.expression as ObjectExpression
      const prop =  (member.key as Identifier).value
      return swc.createKeyValueProperty(prop, 
        swc.createObjectExpression(args?.properties ?? [ swc.createKeyValueProperty('type', swc.createIdentifer('String')) ])
      )
    })
}

const createPropertiesStatement = (element: string, properties: KeyValueProperty[]) => {
  return swc.createExpressionStatement(
    swc.createAssingmentExpression(
      swc.createMemberExpression(swc.createIdentifer(element), swc.createIdentifer('properties')),
      swc.createObjectExpression(properties)
    ))
}

class ProperyDecorator extends Visitor {
  visitModule(e: Module) {
    const moduleItem = e.body.find(content => swc.isClasDeclaration(content)) as ClassDeclaration
    const members = moduleItem.body.filter(member => hasMemberProperty(member))
    const properties = createProperties(members)

    e.body.forEach(content => {
      if (swc.isClasDeclaration(content)) {
        const members = moduleItem.body.map(member => {
          if (swc.isClassProperty(member)) {
            member.decorators = member.decorators.filter(decorator => {
              return swc.isCallExpression(decorator.expression) 
                && swc.isIdentifer(decorator.expression.callee)
                && (!(decorator.expression.callee.value.includes('property')))
            })
          }
          return member
        })
        content.body = members
      }
    })

    e.body.push(createPropertiesStatement(moduleItem.identifier.value, properties))

    return e
  }
}

export function inlinePropertyTransformer() {
  return (program: Program) => new ProperyDecorator().visitProgram(program)
}