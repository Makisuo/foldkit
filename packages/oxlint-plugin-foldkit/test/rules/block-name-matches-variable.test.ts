import * as Testing from 'effect-oxlint/testing'
import { describe, expect, it } from 'vitest'

import { blockNameMatchesVariable } from '../../src/rules/block-name-matches-variable.ts'

const variableDeclarator = (name: string, init: unknown) => ({
  type: 'VariableDeclarator',
  id: Testing.id(name),
  init,
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
      '"People" does not match its Block.define name "PeopleDirectory"',
    )
  })

  it('allows a declaration identifier that matches the Block name', () => {
    const result = Testing.runRule(
      blockNameMatchesVariable,
      'VariableDeclarator',
      variableDeclarator(
        'People',
        Testing.callOfMember('Block', 'define', [Testing.strLiteral('People')]),
      ),
    )

    expect(result).toHaveLength(0)
  })

  it('checks the outer variable of a registered definition', () => {
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
          property: Testing.id('register'),
        },
        arguments: [],
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.diagnostic.message).toContain(
      '"People" does not match its Block.define name "PeopleDirectory"',
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
