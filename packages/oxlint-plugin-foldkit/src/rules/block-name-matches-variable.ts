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

const isApplicationDefineCall = (
  node: ESTree.CallExpression,
  references: WeakMap<ESTree.Node, Reference> | undefined,
): boolean => {
  if (references === undefined) {
    return AST.isCallOf(node, 'Application', 'define')
  }

  return Option.exists(resolveFoldkitApiPath(references, node.callee), path => {
    const [namespace, methodName, extraMember] = path

    return (
      namespace === 'Application' &&
      methodName === 'define' &&
      extraMember === undefined
    )
  })
}

type DefinitionCall = Readonly<{
  call: ESTree.CallExpression
  isApplication: boolean
  isRegistered: boolean
}>

const definitionCall = (
  node: ESTree.CallExpression,
  references: WeakMap<ESTree.Node, Reference> | undefined,
): DefinitionCall | undefined => {
  const isBlock = isBlockDefineCall(node, references)
  const isApplication = isApplicationDefineCall(node, references)
  if (isBlock || isApplication) {
    return { call: node, isApplication, isRegistered: false }
  }

  if (
    !isMemberExpression(node.callee) ||
    node.callee.computed ||
    !isIdentifier(node.callee.property) ||
    !isCallExpression(node.callee.object)
  ) {
    return undefined
  }

  const methodName = node.callee.property.name
  if (methodName !== 'define' && methodName !== 'register') {
    return undefined
  }

  const precedingStage = definitionCall(node.callee.object, references)
  if (precedingStage === undefined) {
    return undefined
  }

  return {
    ...precedingStage,
    isRegistered: precedingStage.isRegistered || methodName === 'register',
  }
}

/** Requires definition bindings to follow the definition stage naming model. */
export const blockNameMatchesVariable = Rule.define({
  name: 'block-name-matches-variable',
  meta: Rule.meta({
    type: 'suggestion',
    description:
      'Name Block and Application definition bindings for their authoring stage.',
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

        const definition = definitionCall(init, references)
        if (definition === undefined) {
          return Effect.void
        }

        if (definition.isApplication) {
          const expectedName = definition.isRegistered
            ? 'Application'
            : 'ApplicationDefinition'
          if (node.id.name === expectedName) {
            return Effect.void
          }

          return ctx.report(
            Diagnostic.make({
              node: node.id,
              message: `Application definition identifier "${node.id.name}" must be "${expectedName}" at this authoring stage.`,
            }),
          )
        }

        const nameArgument = firstStringArgument(definition.call)
        if (nameArgument === undefined) {
          return Effect.void
        }

        const expectedSuffix = `${nameArgument.value}Definition`
        const isValidName = definition.isRegistered
          ? node.id.name.endsWith(expectedSuffix)
          : node.id.name === expectedSuffix
        if (isValidName) {
          return Effect.void
        }

        return ctx.report(
          Diagnostic.make({
            node: node.id,
            message: definition.isRegistered
              ? `Registered Block definition identifier "${node.id.name}" must end with "${expectedSuffix}".`
              : `Block definition identifier "${node.id.name}" must be "${expectedSuffix}".`,
          }),
        )
      },
    }
  },
})
