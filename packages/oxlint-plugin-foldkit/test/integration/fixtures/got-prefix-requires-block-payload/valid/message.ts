import { define as defineApplication } from 'foldkit/application'
import { Effect, Schema } from 'effect'
import { Query } from 'foldkit/experimental'
import { defineMessageUnion } from 'foldkit/message'
import { RadioGroup, Tabs } from '@foldkit/ui'

import * as Child from './child'

const postsQuery = Query.define({
  name: 'Posts',
  data: Schema.Array(Schema.String),
  error: Schema.String,
  handler: function* () { return [] },
})

const FrameworkTabs = Tabs.create()
const DirectionRadioGroup = RadioGroup.create<'Left' | 'Right'>()

const CustomFactory = {
  create: () => ({ block: Child }),
}
const CustomChild = CustomFactory.create()

const Application = defineApplication({ Model, Message })
Application.bindChild(CustomChild.block, {field: 'child',
parentMessage: ParentMessage.GotCustomChildMessage})

const Message = defineMessageUnion({
  ReceivedWeather: { temperature: Schema.Number, },
  GotChildMessage: {
  id: Schema.String,
  message: Child.Message,
  },
  GotPostsMessage: { message: postsQuery.Message },
  GotFrameworkTabsMessage: { message: FrameworkTabs.Message },
  GotDirectionRadioGroupMessage: { message: DirectionRadioGroup.Message },
  GotCustomChildMessage: { message: CustomChild.block.Message },
})
