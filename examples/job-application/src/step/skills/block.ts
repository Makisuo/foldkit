import { EffectsLayer } from './command'
import { SkillsComposition } from './composition'
import { update } from './update'
import { view } from './view'

export const block = SkillsComposition.toBlock({
  init: SkillsComposition.init((initialEntryId: string) => ({
    startup: initialEntryId,
    model: {},
  })),
  update,
  view,
  EffectsLayer,
})
