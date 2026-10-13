// application.ts (parent)
import { settings } from './bindings'
import { registered } from './definition'

export const view = registered.view((model, h) => ({
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
