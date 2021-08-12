import type { Decorator } from '@swc/core'

import * as swc from 'swc-ast-helpers'

export function hasDecorator(decorator: Decorator, text: string){
  return swc.isDecorator(decorator) 
    && swc.isCallExpression(decorator.expression)
    && swc.isIdentifer(decorator.expression.callee)
    && decorator.expression.callee.value.includes(text)
}