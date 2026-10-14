import { settings } from './childBindings'
import { SettingsDefinition } from './definition'
import type { User } from './user'

type ViewInputs = Readonly<{
  currentUser: User
}>

export const view = SettingsDefinition.view.withInputs<ViewInputs>(
  (model, { currentUser }, h) =>
    h.div([], [h.h2([], [`Settings for ${currentUser.name}`])]),
)

h.block(
  settings.embedView({
    slotId: 'settings',
    model: model.settings,
    viewInputs: { currentUser: model.currentUser },
  }),
)
