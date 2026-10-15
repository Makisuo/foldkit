import { Array, Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { saveCanvas } from '../command'
import { ThemeListbox } from '../components'
import { DEFAULT_COLOR_INDEX } from '../constant'
import { Application } from '../definition'
import { Message } from '../message'
import { PALETTE_THEMES } from '../palette'

const foldThemeListboxOutMessage = ThemeListbox.OutMessage.match({
  Selected: ({ value }) =>
    Application.step(model => {
      const themeIndex = Number(value)
      const maybeNextTheme = Array.get(PALETTE_THEMES, themeIndex)
      if (Option.isNone(maybeNextTheme)) {
        return { model }
      }
      const nextModel = modifyFields(model, {
        paletteThemeIndex: () => themeIndex,
        selectedColorIndex: () => DEFAULT_COLOR_INDEX,
      })
      return { model: nextModel, commands: [saveCanvas(nextModel)] }
    }),
})

export const themeListbox = Application.bindChild(ThemeListbox, {
  field: 'themeListbox',
  parentMessage: Message.GotThemeListboxMessage,
  outMessage: { fold: foldThemeListboxOutMessage },
})
