import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Row } from './row'

const Table = Block.define('Table', { Model, Message })

export const rows = Table.bindChild(Row.block, {
  field: 'rows',
  key: 'id',
  toParentMessage: (rowId, message) =>
    Message.GotRowMessage({ rowId, message }),
})
