import { Array, Effect, Option } from 'effect'
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
  resolveImportedPath,
  resolvedVariable,
  staticMemberPath,
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

type DefinitionStage = Readonly<{
  isApplication: boolean
  isComposition: boolean
  identity: string | undefined
}>

const definitionStage = (
  node: ESTree.CallExpression,
  references: WeakMap<ESTree.Node, Reference> | undefined,
  visited: ReadonlySet<ESTree.Node> = new Set(),
): DefinitionStage | undefined => {
  if (visited.has(node)) {
    return undefined
  }

  const isBlock = isBlockDefineCall(node, references)
  const isApplication = isApplicationDefineCall(node, references)
  if (isBlock || isApplication) {
    return {
      isApplication,
      isComposition: false,
      identity: firstStringArgument(node)?.value,
    }
  }

  if (
    !isMemberExpression(node.callee) ||
    node.callee.computed ||
    !isIdentifier(node.callee.property)
  ) {
    return undefined
  }

  const methodName = node.callee.property.name
  if (methodName !== 'define' && methodName !== 'toComposition') {
    return undefined
  }

  const receiver = node.callee.object
  const precedingStage = (() => {
    if (isCallExpression(receiver)) {
      return definitionStage(receiver, references, new Set([...visited, node]))
    }

    if (references === undefined) {
      return undefined
    }

    const path = staticMemberPath(receiver)
    if (Option.isNone(path)) {
      return undefined
    }

    const variable = resolvedVariable(references, path.value.root)
    if (Option.isSome(variable)) {
      for (const definition of variable.value.defs) {
        if (
          definition.type === 'Variable' &&
          isVariableDeclarator(definition.node) &&
          isCallExpression(definition.node.init)
        ) {
          return definitionStage(
            definition.node.init,
            references,
            new Set([...visited, node]),
          )
        }
      }
    }

    const imported = resolveImportedPath(references, receiver)
    if (Option.isSome(imported)) {
      const definitionName = Option.getOrUndefined(
        Array.last(imported.value.members),
      )
      if (definitionName?.endsWith('Definition')) {
        const identity = definitionName.slice(0, -'Definition'.length)
        return {
          identity,
          isApplication: identity === 'Application',
          isComposition: false,
        }
      }
    }

    return undefined
  })()
  if (precedingStage === undefined) {
    return undefined
  }

  return {
    ...precedingStage,
    isComposition:
      precedingStage.isComposition || methodName === 'toComposition',
  }
}

/** Requires definition bindings to follow the Definition and Composition stage naming model. */
export const blockNameMatchesVariable = Rule.define({
  name: 'block-name-matches-variable',
  meta: Rule.meta({
    type: 'suggestion',
    description:
      'Name Block and Application bindings for their authoring stage.',
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

        const definition = definitionStage(init, references)
        if (definition === undefined) {
          return Effect.void
        }

        if (definition.isApplication) {
          const expectedName = definition.isComposition
            ? 'ApplicationComposition'
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

        const identity = definition.identity
        if (identity === undefined) {
          return Effect.void
        }

        const expectedName = `${identity}${definition.isComposition ? 'Composition' : 'Definition'}`
        const isValidName = node.id.name === expectedName
        if (isValidName) {
          return Effect.void
        }

        return ctx.report(
          Diagnostic.make({
            node: node.id,
            message: `Block ${definition.isComposition ? 'Composition' : 'Definition'} identifier "${node.id.name}" must be "${expectedName}".`,
          }),
        )
      },
    }
  },
})
