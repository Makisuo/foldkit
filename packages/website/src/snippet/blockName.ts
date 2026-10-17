import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const SettingsDefinition = Block.define('Settings', { Model, Message })
