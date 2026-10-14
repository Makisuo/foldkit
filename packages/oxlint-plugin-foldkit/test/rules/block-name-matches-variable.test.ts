import * as Testing from 'effect-oxlint/testing'
import { describe, expect, it } from 'vitest'

import { blockNameMatchesVariable } from '../../src/rules/block-name-matches-variable.ts'

const variableDeclarator = (name: string, init: unknown) => ({
  type: 'VariableDeclarator',
  id: Testing.id(name),
  init,
})

const callMethod = (object: unknown, methodName: string) => ({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    computed: false,
    object,
    property: Testing.id(methodName),
  },
  arguments: [],
})

describe('block-name-matches-variable', () => {
  it('flags a declaration identifier that does not match the Block name', () => {
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'People',
        Testing.callOfMember('Block', 'define', [
          Testing.strLiteral('PeopleDirectory'),
        ]),
      ),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.diagnostic.message).toContain(
      '"People" must be "PeopleDirectoryDefinition"',
    )
  })

  it('allows a declaration identifier that matches the Block name', () => {
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'PeopleDefinition',
        Testing.callOfMember('Block', 'define', [Testing.strLiteral('People')]),
      ),
    )

    expect(result).toHaveLength(0)
  })

  it('checks the outer variable of a Composition', () => {
    const defineCall = Testing.callOfMember('Block', 'define', [
      Testing.strLiteral('PeopleDirectory'),
    ])
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator('People', {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: defineCall,
          property: Testing.id('toComposition'),
        },
        arguments: [],
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.diagnostic.message).toContain(
      '"People" must be "PeopleDirectoryComposition"',
    )
  })

  it('allows a graph stage prefix on a Composition', () => {
    const defineCall = Testing.callOfMember('Block', 'define', [
      Testing.strLiteral('PeopleDirectory'),
    ])
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator('PeopleDirectoryComposition', {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: defineCall,
          property: Testing.id('toComposition'),
        },
        arguments: [],
      }),
    )

    expect(result).toHaveLength(0)
  })

  it('unwraps an identity-first typed definition', () => {
    const identity = Testing.callOfMember('Block', 'define', [
      Testing.strLiteral('PeopleDirectory'),
    ])
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'PeopleDirectoryDefinition',
        callMethod(identity, 'define'),
      ),
    )

    expect(result).toHaveLength(0)
  })

  it('unwraps an identity-first Composition', () => {
    const identity = Testing.callOfMember('Block', 'define', [
      Testing.strLiteral('PeopleDirectory'),
    ])
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'PeopleDirectoryComposition',
        callMethod(callMethod(identity, 'define'), 'toComposition'),
      ),
    )

    expect(result).toHaveLength(0)
  })

  it('requires ApplicationDefinition before toComposition', () => {
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'Application',
        Testing.callOfMember('Application', 'define', []),
      ),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.diagnostic.message).toContain(
      '"Application" must be "ApplicationDefinition"',
    )
  })

  it('requires ApplicationComposition after inline toComposition', () => {
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'ApplicationDefinition',
        callMethod(
          Testing.callOfMember('Application', 'define', []),
          'toComposition',
        ),
      ),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.diagnostic.message).toContain(
      '"ApplicationDefinition" must be "ApplicationComposition"',
    )
  })

  it('ignores dynamic Block names', () => {
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'People',
        Testing.callOfMember('Block', 'define', [Testing.id('blockName')]),
      ),
    )

    expect(result).toHaveLength(0)
  })

  it('ignores unrelated define methods', () => {
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'People',
        Testing.callOfMember('Registry', 'define', [
          Testing.strLiteral('PeopleDirectory'),
        ]),
      ),
    )

    expect(result).toHaveLength(0)
  })
})
