import type { Decorator, Module, ObjectExpression, ClassProperty, Identifier, ClassMember, Program, CallExpression, KeyValueProperty } from '@swc/core'
import Visitor from '@swc/core/Visitor.js'
import * as swc from 'swc-ast-helpers'

import { hasDecorator, isClasDeclaration, getClassDeclaration, updateMembers } from '@/utils'

const hasMemberProperty = (member: ClassMember) => 
  swc.isClassProperty(member) && member.decorators.find(decorator => hasDecorator(decorator, 'property'))

const createProperties = (members: ClassMember[]) => {
  return members  
    .filter(member => hasMemberProperty(member))
    .map((member: ClassProperty) => {
      const args = ((member.decorators[0] as Decorator).expression as CallExpression).arguments?.[0]?.expression as ObjectExpression
      const prop =  (member.key as Identifier).value
      return swc.createKeyValueProperty(prop, 
        swc.createObjectExpression(
          args?.properties 
          ?? [ swc.createKeyValueProperty('type', swc.createIdentifer('String')) ]
        ))
    })
}

const createPropertiesStatement = (element: string, properties: KeyValueProperty[]) => {
  return swc.createExpressionStatement(
    swc.createAssignmentExpression(
      swc.createMemberExpression(swc.createIdentifer(element), swc.createIdentifer('properties')),
      swc.createObjectExpression(properties)
    ))
}

class ProperyDecorator extends Visitor {
  visitModule(e: Module) {
    const moduleItem = getClassDeclaration(e.body)

    if (moduleItem) {
      const members = moduleItem.body.filter(member => hasMemberProperty(member))
      const properties = createProperties(members)
      if (properties?.length > 0) {
        const toUpdateMember = () => updateMembers(moduleItem.body, ['property']);
        e.body.forEach(content => {
          if (swc.isClasDeclaration(content) && isClasDeclaration(content)) {
            content.body = toUpdateMember()
          }
          if (
            swc.isExportDeclaration(content) 
            && swc.isClasDeclaration(content.declaration) 
            && isClasDeclaration(content.declaration)
          ) {
            content.declaration.body = toUpdateMember()
          }
        })
        e.body.push(createPropertiesStatement(moduleItem.identifier.value, properties))
      }
    }

    return e
  }
}

export function inlinePropertyTransformer() {
  return (program: Program) => new ProperyDecorator().visitProgram(program)
}