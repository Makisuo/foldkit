import { Block } from 'foldkit'

// ✅ Good: the child declares an operation that runs its update.

const SettingsComposition = SettingsDefinition.makeComposition()
const requestThemeChange = Message.RequestedThemeChange

const assemble = () =>
  SettingsComposition.assembleBlock({
    init,
    update,
    operations: { requestThemeChange },
    EffectsLayer,
  })
export const block: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)

const update = ParentComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () =>
      SettingsBinding.requestThemeChange({ theme: 'Light' })(model),
  }),
)
