import { Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

const Model = Schema.Struct({ routeChangeCount: Schema.Number })
const Message = defineMessageUnion({
  InformedOfRouteChange: {},
  ClickedReset: {},
})
const RouteAwareDefinition = Block.define('RouteAware', { Model, Message })
const RouteAwareComposition = RouteAwareDefinition.makeComposition()
const informRouteChanged = Message.InformedOfRouteChange

const update = RouteAwareComposition.makeUpdate((model, message) =>
  Message.match(message, {
    InformedOfRouteChange: () => ({
      model: modifyFields(model, {
        routeChangeCount: count => count + 1,
      }),
    }),
    ClickedReset: () => ({
      model: modifyFields(model, { routeChangeCount: () => 0 }),
    }),
  }),
)

export const block = RouteAwareComposition.makeBlock({
  init: RouteAwareComposition.makeInit(() => ({
    model: Model.make({ routeChangeCount: 0 }),
  })),
  update,
  operations: { informRouteChanged },
})
