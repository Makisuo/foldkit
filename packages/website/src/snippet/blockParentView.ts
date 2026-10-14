// view.ts (parent)
import { Application } from './application'
import { settings } from './connection'

export const view = Application.view((model, h) => ({
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
