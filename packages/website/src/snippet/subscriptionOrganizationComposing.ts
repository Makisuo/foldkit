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

export const SettingsDefinition = Block.define('Settings', {
  Model,
  Message,
})

const ThemeMenuBinding = SettingsDefinition.bindChild(ThemeMenu.block, {
  field: 'themeMenu',
  parentMessage: Message.GotThemeMenuMessage,
  outMessage: { fold: foldThemeMenuOutMessage },
})

export const SettingsComposition = SettingsDefinition.makeComposition({
  childBindings: [ThemeMenuBinding],
})
