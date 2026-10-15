// view.ts (parent)
import { ApplicationComposition, settings } from './application'

export const view = ApplicationComposition.view((model, h) => ({
  title: 'My App',
  body: h.div(
    [h.Class('min-h-screen bg-gray-50')],
    [
      h.block(
        settings.embedView({ slotId: 'settings', model: model.settings }),
      ),
    ],
  ),
}))
