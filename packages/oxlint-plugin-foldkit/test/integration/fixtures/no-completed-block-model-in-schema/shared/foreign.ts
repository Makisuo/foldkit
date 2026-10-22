const Registry = {
  makeDefinition: () => ({
    makeComposition: () => ({
      assembleBlock: () => ({ Model: 'unrelated' }),
    }),
  }),
}
const ChildDefinition = Registry.makeDefinition()
const ChildComposition = ChildDefinition.makeComposition()
export const ChildBlock = ChildComposition.assembleBlock()
