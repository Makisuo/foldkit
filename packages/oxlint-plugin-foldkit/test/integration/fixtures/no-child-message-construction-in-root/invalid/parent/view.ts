import { Message as ChildMessage } from '../child/definition'
import { Message as EntryMessage } from './entry/definition'
import type { ViewBuilder as EntryViewBuilder } from './entry/entry'
import { ParentComposition } from './parent'

const AliasedEntryMessage = EntryMessage

const foreignEntryButton = (h: EntryViewBuilder) =>
  h.button([h.OnClick(EntryMessage.ClickedEntryFromForeignBuilder())])

export const view = ParentComposition.view((_model, h) =>
  h.div(
    [h.OnClick(ChildMessage.ClickedChildSave())],
    [
      h.button([h.OnClick(AliasedEntryMessage.ClickedEntrySave())]),
      foreignEntryButton(h),
    ],
  ),
)
