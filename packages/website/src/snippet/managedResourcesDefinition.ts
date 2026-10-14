// resource.ts
import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const CameraDefinition = Block.define('Camera', { Model, Message })
export const CameraStream =
  CameraDefinition.resource<MediaStream>()('CameraStream')
