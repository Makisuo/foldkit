import { Block } from 'foldkit'
import type * as Update from 'foldkit/update'

import { Message } from './message'
import { Model } from './model'
import * as ThemeMenu from './themeMenu'

const foldThemeMenuOutMessage = ThemeMenu.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected: () => model => ({ model }),
})

const themeMenu = ThemeMenu.block.connection({
  Model,
  field: 'themeMenu',
  parentMessage: Message.GotThemeMenuMessage,
  outMessage: { fold: foldThemeMenuOutMessage },
})

export const SettingsDefinition = Block.define('Settings', {
  Model,
  Message,
}).register({
  children: [themeMenu],
})
