import { Effect, Option } from 'effect'
import {
  AST,
  Diagnostic,
  type ESTree,
  type Reference,
  Rule,
  RuleContext,
} from 'effect-oxlint'

import {
  firstStringArgument,
  indexReferences,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isVariableDeclarator,
  resolveFoldkitApiPath,
} from '../guards.ts'

const isBlockDefineCall = (
  node: ESTree.CallExpression,
  references: WeakMap<ESTree.Node, Reference> | undefined,
): boolean => {
  if (references === undefined) {
    return AST.isCallOf(node, 'Block', 'define')
  }

  return Option.exists(resolveFoldkitApiPath(references, node.callee), path => {
    const [namespace, methodName, extraMember] = path

    return (
      namespace === 'Block' &&
      methodName === 'define' &&
      extraMember === undefined
    )
  })
}

const blockDefineCall = (
  node: ESTree.CallExpression,
  references: WeakMap<ESTree.Node, Reference> | undefined,
): ESTree.CallExpression | undefined => {
  if (isBlockDefineCall(node, references)) {
    return node
  }

  if (
    !isMemberExpression(node.callee) ||
    node.callee.computed ||
    !isIdentifier(node.callee.property, 'register') ||
    !isCallExpression(node.callee.object) ||
    !isBlockDefineCall(node.callee.object, references)
  ) {
    return undefined
  }

  return node.callee.object
}

/** Requires a variable bound to Block.define to match its literal name. */
export const blockNameMatchesVariable = Rule.define({
  name: 'block-name-matches-variable',
  meta: Rule.meta({
    type: 'suggestion',
    description:
      'Keep a Block declaration identifier in sync with its Block.define name.',
  }),
  create: function* () {
    const ctx = yield* RuleContext
    const scopes = ctx.sourceCode.scopeManager?.scopes
    const references =
      scopes === undefined ? undefined : indexReferences(scopes)

    return {
      VariableDeclarator: (node: ESTree.Node) => {
        if (!isVariableDeclarator(node) || !isIdentifier(node.id)) {
          return Effect.void
        }

        const init = node.init
        if (!isCallExpression(init)) {
          return Effect.void
        }

        const defineCall = blockDefineCall(init, references)
        if (defineCall === undefined) {
          return Effect.void
        }

        const nameArgument = firstStringArgument(defineCall)
        if (nameArgument === undefined || node.id.name === nameArgument.value) {
          return Effect.void
        }

        return ctx.report(
          Diagnostic.make({
            node: node.id,
            message: `Block declaration identifier "${node.id.name}" does not match its Block.define name "${nameArgument.value}".`,
          }),
        )
      },
    }
  },
})
