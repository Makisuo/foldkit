import { Context, Effect, Layer, Option, Schema } from 'effect'
import {
  type Element as ElementProgram,
  define as defineApplication,
} from 'foldkit/application'
import * as Block from 'foldkit/block'
import { defineMessageUnion } from 'foldkit/message'
import type * as Update from 'foldkit/update'

const WarmupModel = Schema.Struct({ value: Schema.Number })
const WarmupMessage = defineMessageUnion({ CompletedWarmup: {} })

// oxlint-disable-next-line effecttsgo/floating-effect
Effect.void
Layer.empty
Option.none()
defineApplication({ Model: WarmupModel, Message: WarmupMessage })
Context.Service
Block.define('TypePerformanceWarmup', {
  Model: WarmupModel,
  Message: WarmupMessage,
})

export type WarmupStep = Update.Step<
  typeof WarmupModel.Type,
  typeof WarmupMessage.Type
>
export type WarmupElement = ElementProgram

const LeafModel = Schema.Struct({ value: Schema.Number })
type LeafModel = typeof LeafModel.Type

const LeafMessage = defineMessageUnion({ RequestedRun: {}, CompletedRun: {} })
type LeafMessage = typeof LeafMessage.Type

class Clock extends Context.Service<
  Clock,
  Readonly<{ run: Effect.Effect<void> }>
>()('TypePerformanceWideLeafClock') {}
const ClockLayer = Layer.succeed(Clock, { run: Effect.void })

const TypePerformanceWideLeafDefinition = Block.define(
  'TypePerformanceWideLeaf',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const RunLeaf = TypePerformanceWideLeafDefinition.command('RunLeaf', {
  messages: [LeafMessage.CompletedRun],
  handler: function* () {
    const clock = yield* Clock

    return () => clock.run.pipe(Effect.as(LeafMessage.CompletedRun()))
  },
})
const runLeaf = TypePerformanceWideLeafDefinition.step(model => ({
  model,
  commands: [RunLeaf()],
}))
const Leaf = TypePerformanceWideLeafDefinition.toBlock({
  init: () => ({ model: LeafModel.make({ value: 0 }) }),
  update: TypePerformanceWideLeafDefinition.update((model, message) =>
    LeafMessage.match(message, {
      RequestedRun: () => runLeaf(model),
      CompletedRun: () => ({ model }),
    }),
  ),
  expose: { runLeaf },
  EffectsLayer: RunLeaf.layer,
})

const ApplicationModel = Schema.Struct({ leaf: LeafModel })
type ApplicationModel = typeof ApplicationModel.Type

// oxlint-disable foldkit/got-prefix-requires-block-payload
const ApplicationMessage = defineMessageUnion({
  GotLeaf001Message: { message: Leaf.Message },
  GotLeaf002Message: { message: Leaf.Message },
  GotLeaf003Message: { message: Leaf.Message },
  GotLeaf004Message: { message: Leaf.Message },
  GotLeaf005Message: { message: Leaf.Message },
  GotLeaf006Message: { message: Leaf.Message },
  GotLeaf007Message: { message: Leaf.Message },
  GotLeaf008Message: { message: Leaf.Message },
  GotLeaf009Message: { message: Leaf.Message },
  GotLeaf010Message: { message: Leaf.Message },
  GotLeaf011Message: { message: Leaf.Message },
  GotLeaf012Message: { message: Leaf.Message },
  GotLeaf013Message: { message: Leaf.Message },
  GotLeaf014Message: { message: Leaf.Message },
  GotLeaf015Message: { message: Leaf.Message },
  GotLeaf016Message: { message: Leaf.Message },
  GotLeaf017Message: { message: Leaf.Message },
  GotLeaf018Message: { message: Leaf.Message },
  GotLeaf019Message: { message: Leaf.Message },
  GotLeaf020Message: { message: Leaf.Message },
  GotLeaf021Message: { message: Leaf.Message },
  GotLeaf022Message: { message: Leaf.Message },
  GotLeaf023Message: { message: Leaf.Message },
  GotLeaf024Message: { message: Leaf.Message },
  GotLeaf025Message: { message: Leaf.Message },
  GotLeaf026Message: { message: Leaf.Message },
  GotLeaf027Message: { message: Leaf.Message },
  GotLeaf028Message: { message: Leaf.Message },
  GotLeaf029Message: { message: Leaf.Message },
  GotLeaf030Message: { message: Leaf.Message },
  GotLeaf031Message: { message: Leaf.Message },
  GotLeaf032Message: { message: Leaf.Message },
  GotLeaf033Message: { message: Leaf.Message },
  GotLeaf034Message: { message: Leaf.Message },
  GotLeaf035Message: { message: Leaf.Message },
  GotLeaf036Message: { message: Leaf.Message },
  GotLeaf037Message: { message: Leaf.Message },
  GotLeaf038Message: { message: Leaf.Message },
  GotLeaf039Message: { message: Leaf.Message },
  GotLeaf040Message: { message: Leaf.Message },
  GotLeaf041Message: { message: Leaf.Message },
  GotLeaf042Message: { message: Leaf.Message },
  GotLeaf043Message: { message: Leaf.Message },
  GotLeaf044Message: { message: Leaf.Message },
  GotLeaf045Message: { message: Leaf.Message },
  GotLeaf046Message: { message: Leaf.Message },
  GotLeaf047Message: { message: Leaf.Message },
  GotLeaf048Message: { message: Leaf.Message },
  GotLeaf049Message: { message: Leaf.Message },
  GotLeaf050Message: { message: Leaf.Message },
  GotLeaf051Message: { message: Leaf.Message },
  GotLeaf052Message: { message: Leaf.Message },
  GotLeaf053Message: { message: Leaf.Message },
  GotLeaf054Message: { message: Leaf.Message },
  GotLeaf055Message: { message: Leaf.Message },
  GotLeaf056Message: { message: Leaf.Message },
  GotLeaf057Message: { message: Leaf.Message },
  GotLeaf058Message: { message: Leaf.Message },
  GotLeaf059Message: { message: Leaf.Message },
  GotLeaf060Message: { message: Leaf.Message },
  GotLeaf061Message: { message: Leaf.Message },
  GotLeaf062Message: { message: Leaf.Message },
  GotLeaf063Message: { message: Leaf.Message },
  GotLeaf064Message: { message: Leaf.Message },
  GotLeaf065Message: { message: Leaf.Message },
  GotLeaf066Message: { message: Leaf.Message },
  GotLeaf067Message: { message: Leaf.Message },
  GotLeaf068Message: { message: Leaf.Message },
  GotLeaf069Message: { message: Leaf.Message },
  GotLeaf070Message: { message: Leaf.Message },
  GotLeaf071Message: { message: Leaf.Message },
  GotLeaf072Message: { message: Leaf.Message },
  GotLeaf073Message: { message: Leaf.Message },
  GotLeaf074Message: { message: Leaf.Message },
  GotLeaf075Message: { message: Leaf.Message },
  GotLeaf076Message: { message: Leaf.Message },
  GotLeaf077Message: { message: Leaf.Message },
  GotLeaf078Message: { message: Leaf.Message },
  GotLeaf079Message: { message: Leaf.Message },
  GotLeaf080Message: { message: Leaf.Message },
  GotLeaf081Message: { message: Leaf.Message },
  GotLeaf082Message: { message: Leaf.Message },
  GotLeaf083Message: { message: Leaf.Message },
  GotLeaf084Message: { message: Leaf.Message },
  GotLeaf085Message: { message: Leaf.Message },
  GotLeaf086Message: { message: Leaf.Message },
  GotLeaf087Message: { message: Leaf.Message },
  GotLeaf088Message: { message: Leaf.Message },
  GotLeaf089Message: { message: Leaf.Message },
  GotLeaf090Message: { message: Leaf.Message },
  GotLeaf091Message: { message: Leaf.Message },
  GotLeaf092Message: { message: Leaf.Message },
  GotLeaf093Message: { message: Leaf.Message },
  GotLeaf094Message: { message: Leaf.Message },
  GotLeaf095Message: { message: Leaf.Message },
  GotLeaf096Message: { message: Leaf.Message },
  GotLeaf097Message: { message: Leaf.Message },
  GotLeaf098Message: { message: Leaf.Message },
  GotLeaf099Message: { message: Leaf.Message },
  GotLeaf100Message: { message: Leaf.Message },
})
// oxlint-enable foldkit/got-prefix-requires-block-payload

const leaf001 = Leaf.connection({
  placement: 'leaf001',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf001Message,
})

const leaf002 = Leaf.connection({
  placement: 'leaf002',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf002Message,
})

const leaf003 = Leaf.connection({
  placement: 'leaf003',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf003Message,
})

const leaf004 = Leaf.connection({
  placement: 'leaf004',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf004Message,
})

const leaf005 = Leaf.connection({
  placement: 'leaf005',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf005Message,
})

const leaf006 = Leaf.connection({
  placement: 'leaf006',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf006Message,
})

const leaf007 = Leaf.connection({
  placement: 'leaf007',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf007Message,
})

const leaf008 = Leaf.connection({
  placement: 'leaf008',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf008Message,
})

const leaf009 = Leaf.connection({
  placement: 'leaf009',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf009Message,
})

const leaf010 = Leaf.connection({
  placement: 'leaf010',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf010Message,
})

const leaf011 = Leaf.connection({
  placement: 'leaf011',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf011Message,
})

const leaf012 = Leaf.connection({
  placement: 'leaf012',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf012Message,
})

const leaf013 = Leaf.connection({
  placement: 'leaf013',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf013Message,
})

const leaf014 = Leaf.connection({
  placement: 'leaf014',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf014Message,
})

const leaf015 = Leaf.connection({
  placement: 'leaf015',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf015Message,
})

const leaf016 = Leaf.connection({
  placement: 'leaf016',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf016Message,
})

const leaf017 = Leaf.connection({
  placement: 'leaf017',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf017Message,
})

const leaf018 = Leaf.connection({
  placement: 'leaf018',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf018Message,
})

const leaf019 = Leaf.connection({
  placement: 'leaf019',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf019Message,
})

const leaf020 = Leaf.connection({
  placement: 'leaf020',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf020Message,
})

const leaf021 = Leaf.connection({
  placement: 'leaf021',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf021Message,
})

const leaf022 = Leaf.connection({
  placement: 'leaf022',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf022Message,
})

const leaf023 = Leaf.connection({
  placement: 'leaf023',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf023Message,
})

const leaf024 = Leaf.connection({
  placement: 'leaf024',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf024Message,
})

const leaf025 = Leaf.connection({
  placement: 'leaf025',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf025Message,
})

const leaf026 = Leaf.connection({
  placement: 'leaf026',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf026Message,
})

const leaf027 = Leaf.connection({
  placement: 'leaf027',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf027Message,
})

const leaf028 = Leaf.connection({
  placement: 'leaf028',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf028Message,
})

const leaf029 = Leaf.connection({
  placement: 'leaf029',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf029Message,
})

const leaf030 = Leaf.connection({
  placement: 'leaf030',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf030Message,
})

const leaf031 = Leaf.connection({
  placement: 'leaf031',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf031Message,
})

const leaf032 = Leaf.connection({
  placement: 'leaf032',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf032Message,
})

const leaf033 = Leaf.connection({
  placement: 'leaf033',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf033Message,
})

const leaf034 = Leaf.connection({
  placement: 'leaf034',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf034Message,
})

const leaf035 = Leaf.connection({
  placement: 'leaf035',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf035Message,
})

const leaf036 = Leaf.connection({
  placement: 'leaf036',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf036Message,
})

const leaf037 = Leaf.connection({
  placement: 'leaf037',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf037Message,
})

const leaf038 = Leaf.connection({
  placement: 'leaf038',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf038Message,
})

const leaf039 = Leaf.connection({
  placement: 'leaf039',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf039Message,
})

const leaf040 = Leaf.connection({
  placement: 'leaf040',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf040Message,
})

const leaf041 = Leaf.connection({
  placement: 'leaf041',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf041Message,
})

const leaf042 = Leaf.connection({
  placement: 'leaf042',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf042Message,
})

const leaf043 = Leaf.connection({
  placement: 'leaf043',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf043Message,
})

const leaf044 = Leaf.connection({
  placement: 'leaf044',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf044Message,
})

const leaf045 = Leaf.connection({
  placement: 'leaf045',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf045Message,
})

const leaf046 = Leaf.connection({
  placement: 'leaf046',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf046Message,
})

const leaf047 = Leaf.connection({
  placement: 'leaf047',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf047Message,
})

const leaf048 = Leaf.connection({
  placement: 'leaf048',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf048Message,
})

const leaf049 = Leaf.connection({
  placement: 'leaf049',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf049Message,
})

const leaf050 = Leaf.connection({
  placement: 'leaf050',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf050Message,
})

const leaf051 = Leaf.connection({
  placement: 'leaf051',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf051Message,
})

const leaf052 = Leaf.connection({
  placement: 'leaf052',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf052Message,
})

const leaf053 = Leaf.connection({
  placement: 'leaf053',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf053Message,
})

const leaf054 = Leaf.connection({
  placement: 'leaf054',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf054Message,
})

const leaf055 = Leaf.connection({
  placement: 'leaf055',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf055Message,
})

const leaf056 = Leaf.connection({
  placement: 'leaf056',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf056Message,
})

const leaf057 = Leaf.connection({
  placement: 'leaf057',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf057Message,
})

const leaf058 = Leaf.connection({
  placement: 'leaf058',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf058Message,
})

const leaf059 = Leaf.connection({
  placement: 'leaf059',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf059Message,
})

const leaf060 = Leaf.connection({
  placement: 'leaf060',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf060Message,
})

const leaf061 = Leaf.connection({
  placement: 'leaf061',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf061Message,
})

const leaf062 = Leaf.connection({
  placement: 'leaf062',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf062Message,
})

const leaf063 = Leaf.connection({
  placement: 'leaf063',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf063Message,
})

const leaf064 = Leaf.connection({
  placement: 'leaf064',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf064Message,
})

const leaf065 = Leaf.connection({
  placement: 'leaf065',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf065Message,
})

const leaf066 = Leaf.connection({
  placement: 'leaf066',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf066Message,
})

const leaf067 = Leaf.connection({
  placement: 'leaf067',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf067Message,
})

const leaf068 = Leaf.connection({
  placement: 'leaf068',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf068Message,
})

const leaf069 = Leaf.connection({
  placement: 'leaf069',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf069Message,
})

const leaf070 = Leaf.connection({
  placement: 'leaf070',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf070Message,
})

const leaf071 = Leaf.connection({
  placement: 'leaf071',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf071Message,
})

const leaf072 = Leaf.connection({
  placement: 'leaf072',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf072Message,
})

const leaf073 = Leaf.connection({
  placement: 'leaf073',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf073Message,
})

const leaf074 = Leaf.connection({
  placement: 'leaf074',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf074Message,
})

const leaf075 = Leaf.connection({
  placement: 'leaf075',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf075Message,
})

const leaf076 = Leaf.connection({
  placement: 'leaf076',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf076Message,
})

const leaf077 = Leaf.connection({
  placement: 'leaf077',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf077Message,
})

const leaf078 = Leaf.connection({
  placement: 'leaf078',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf078Message,
})

const leaf079 = Leaf.connection({
  placement: 'leaf079',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf079Message,
})

const leaf080 = Leaf.connection({
  placement: 'leaf080',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf080Message,
})

const leaf081 = Leaf.connection({
  placement: 'leaf081',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf081Message,
})

const leaf082 = Leaf.connection({
  placement: 'leaf082',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf082Message,
})

const leaf083 = Leaf.connection({
  placement: 'leaf083',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf083Message,
})

const leaf084 = Leaf.connection({
  placement: 'leaf084',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf084Message,
})

const leaf085 = Leaf.connection({
  placement: 'leaf085',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf085Message,
})

const leaf086 = Leaf.connection({
  placement: 'leaf086',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf086Message,
})

const leaf087 = Leaf.connection({
  placement: 'leaf087',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf087Message,
})

const leaf088 = Leaf.connection({
  placement: 'leaf088',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf088Message,
})

const leaf089 = Leaf.connection({
  placement: 'leaf089',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf089Message,
})

const leaf090 = Leaf.connection({
  placement: 'leaf090',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf090Message,
})

const leaf091 = Leaf.connection({
  placement: 'leaf091',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf091Message,
})

const leaf092 = Leaf.connection({
  placement: 'leaf092',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf092Message,
})

const leaf093 = Leaf.connection({
  placement: 'leaf093',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf093Message,
})

const leaf094 = Leaf.connection({
  placement: 'leaf094',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf094Message,
})

const leaf095 = Leaf.connection({
  placement: 'leaf095',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf095Message,
})

const leaf096 = Leaf.connection({
  placement: 'leaf096',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf096Message,
})

const leaf097 = Leaf.connection({
  placement: 'leaf097',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf097Message,
})

const leaf098 = Leaf.connection({
  placement: 'leaf098',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf098Message,
})

const leaf099 = Leaf.connection({
  placement: 'leaf099',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf099Message,
})

const leaf100 = Leaf.connection({
  placement: 'leaf100',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf100Message,
})

const Application = defineApplication({
  Model: ApplicationModel,
  Message: ApplicationMessage,
}).register({
  children: [
    leaf001,
    leaf002,
    leaf003,
    leaf004,
    leaf005,
    leaf006,
    leaf007,
    leaf008,
    leaf009,
    leaf010,
    leaf011,
    leaf012,
    leaf013,
    leaf014,
    leaf015,
    leaf016,
    leaf017,
    leaf018,
    leaf019,
    leaf020,
    leaf021,
    leaf022,
    leaf023,
    leaf024,
    leaf025,
    leaf026,
    leaf027,
    leaf028,
    leaf029,
    leaf030,
    leaf031,
    leaf032,
    leaf033,
    leaf034,
    leaf035,
    leaf036,
    leaf037,
    leaf038,
    leaf039,
    leaf040,
    leaf041,
    leaf042,
    leaf043,
    leaf044,
    leaf045,
    leaf046,
    leaf047,
    leaf048,
    leaf049,
    leaf050,
    leaf051,
    leaf052,
    leaf053,
    leaf054,
    leaf055,
    leaf056,
    leaf057,
    leaf058,
    leaf059,
    leaf060,
    leaf061,
    leaf062,
    leaf063,
    leaf064,
    leaf065,
    leaf066,
    leaf067,
    leaf068,
    leaf069,
    leaf070,
    leaf071,
    leaf072,
    leaf073,
    leaf074,
    leaf075,
    leaf076,
    leaf077,
    leaf078,
    leaf079,
    leaf080,
    leaf081,
    leaf082,
    leaf083,
    leaf084,
    leaf085,
    leaf086,
    leaf087,
    leaf088,
    leaf089,
    leaf090,
    leaf091,
    leaf092,
    leaf093,
    leaf094,
    leaf095,
    leaf096,
    leaf097,
    leaf098,
    leaf099,
    leaf100,
  ],
})

const update = Application.update((model, message) =>
  ApplicationMessage.match(message, {
    GotLeaf001Message: ({ message }) => leaf001.fold(model, message),
    GotLeaf002Message: ({ message }) => leaf002.fold(model, message),
    GotLeaf003Message: ({ message }) => leaf003.fold(model, message),
    GotLeaf004Message: ({ message }) => leaf004.fold(model, message),
    GotLeaf005Message: ({ message }) => leaf005.fold(model, message),
    GotLeaf006Message: ({ message }) => leaf006.fold(model, message),
    GotLeaf007Message: ({ message }) => leaf007.fold(model, message),
    GotLeaf008Message: ({ message }) => leaf008.fold(model, message),
    GotLeaf009Message: ({ message }) => leaf009.fold(model, message),
    GotLeaf010Message: ({ message }) => leaf010.fold(model, message),
    GotLeaf011Message: ({ message }) => leaf011.fold(model, message),
    GotLeaf012Message: ({ message }) => leaf012.fold(model, message),
    GotLeaf013Message: ({ message }) => leaf013.fold(model, message),
    GotLeaf014Message: ({ message }) => leaf014.fold(model, message),
    GotLeaf015Message: ({ message }) => leaf015.fold(model, message),
    GotLeaf016Message: ({ message }) => leaf016.fold(model, message),
    GotLeaf017Message: ({ message }) => leaf017.fold(model, message),
    GotLeaf018Message: ({ message }) => leaf018.fold(model, message),
    GotLeaf019Message: ({ message }) => leaf019.fold(model, message),
    GotLeaf020Message: ({ message }) => leaf020.fold(model, message),
    GotLeaf021Message: ({ message }) => leaf021.fold(model, message),
    GotLeaf022Message: ({ message }) => leaf022.fold(model, message),
    GotLeaf023Message: ({ message }) => leaf023.fold(model, message),
    GotLeaf024Message: ({ message }) => leaf024.fold(model, message),
    GotLeaf025Message: ({ message }) => leaf025.fold(model, message),
    GotLeaf026Message: ({ message }) => leaf026.fold(model, message),
    GotLeaf027Message: ({ message }) => leaf027.fold(model, message),
    GotLeaf028Message: ({ message }) => leaf028.fold(model, message),
    GotLeaf029Message: ({ message }) => leaf029.fold(model, message),
    GotLeaf030Message: ({ message }) => leaf030.fold(model, message),
    GotLeaf031Message: ({ message }) => leaf031.fold(model, message),
    GotLeaf032Message: ({ message }) => leaf032.fold(model, message),
    GotLeaf033Message: ({ message }) => leaf033.fold(model, message),
    GotLeaf034Message: ({ message }) => leaf034.fold(model, message),
    GotLeaf035Message: ({ message }) => leaf035.fold(model, message),
    GotLeaf036Message: ({ message }) => leaf036.fold(model, message),
    GotLeaf037Message: ({ message }) => leaf037.fold(model, message),
    GotLeaf038Message: ({ message }) => leaf038.fold(model, message),
    GotLeaf039Message: ({ message }) => leaf039.fold(model, message),
    GotLeaf040Message: ({ message }) => leaf040.fold(model, message),
    GotLeaf041Message: ({ message }) => leaf041.fold(model, message),
    GotLeaf042Message: ({ message }) => leaf042.fold(model, message),
    GotLeaf043Message: ({ message }) => leaf043.fold(model, message),
    GotLeaf044Message: ({ message }) => leaf044.fold(model, message),
    GotLeaf045Message: ({ message }) => leaf045.fold(model, message),
    GotLeaf046Message: ({ message }) => leaf046.fold(model, message),
    GotLeaf047Message: ({ message }) => leaf047.fold(model, message),
    GotLeaf048Message: ({ message }) => leaf048.fold(model, message),
    GotLeaf049Message: ({ message }) => leaf049.fold(model, message),
    GotLeaf050Message: ({ message }) => leaf050.fold(model, message),
    GotLeaf051Message: ({ message }) => leaf051.fold(model, message),
    GotLeaf052Message: ({ message }) => leaf052.fold(model, message),
    GotLeaf053Message: ({ message }) => leaf053.fold(model, message),
    GotLeaf054Message: ({ message }) => leaf054.fold(model, message),
    GotLeaf055Message: ({ message }) => leaf055.fold(model, message),
    GotLeaf056Message: ({ message }) => leaf056.fold(model, message),
    GotLeaf057Message: ({ message }) => leaf057.fold(model, message),
    GotLeaf058Message: ({ message }) => leaf058.fold(model, message),
    GotLeaf059Message: ({ message }) => leaf059.fold(model, message),
    GotLeaf060Message: ({ message }) => leaf060.fold(model, message),
    GotLeaf061Message: ({ message }) => leaf061.fold(model, message),
    GotLeaf062Message: ({ message }) => leaf062.fold(model, message),
    GotLeaf063Message: ({ message }) => leaf063.fold(model, message),
    GotLeaf064Message: ({ message }) => leaf064.fold(model, message),
    GotLeaf065Message: ({ message }) => leaf065.fold(model, message),
    GotLeaf066Message: ({ message }) => leaf066.fold(model, message),
    GotLeaf067Message: ({ message }) => leaf067.fold(model, message),
    GotLeaf068Message: ({ message }) => leaf068.fold(model, message),
    GotLeaf069Message: ({ message }) => leaf069.fold(model, message),
    GotLeaf070Message: ({ message }) => leaf070.fold(model, message),
    GotLeaf071Message: ({ message }) => leaf071.fold(model, message),
    GotLeaf072Message: ({ message }) => leaf072.fold(model, message),
    GotLeaf073Message: ({ message }) => leaf073.fold(model, message),
    GotLeaf074Message: ({ message }) => leaf074.fold(model, message),
    GotLeaf075Message: ({ message }) => leaf075.fold(model, message),
    GotLeaf076Message: ({ message }) => leaf076.fold(model, message),
    GotLeaf077Message: ({ message }) => leaf077.fold(model, message),
    GotLeaf078Message: ({ message }) => leaf078.fold(model, message),
    GotLeaf079Message: ({ message }) => leaf079.fold(model, message),
    GotLeaf080Message: ({ message }) => leaf080.fold(model, message),
    GotLeaf081Message: ({ message }) => leaf081.fold(model, message),
    GotLeaf082Message: ({ message }) => leaf082.fold(model, message),
    GotLeaf083Message: ({ message }) => leaf083.fold(model, message),
    GotLeaf084Message: ({ message }) => leaf084.fold(model, message),
    GotLeaf085Message: ({ message }) => leaf085.fold(model, message),
    GotLeaf086Message: ({ message }) => leaf086.fold(model, message),
    GotLeaf087Message: ({ message }) => leaf087.fold(model, message),
    GotLeaf088Message: ({ message }) => leaf088.fold(model, message),
    GotLeaf089Message: ({ message }) => leaf089.fold(model, message),
    GotLeaf090Message: ({ message }) => leaf090.fold(model, message),
    GotLeaf091Message: ({ message }) => leaf091.fold(model, message),
    GotLeaf092Message: ({ message }) => leaf092.fold(model, message),
    GotLeaf093Message: ({ message }) => leaf093.fold(model, message),
    GotLeaf094Message: ({ message }) => leaf094.fold(model, message),
    GotLeaf095Message: ({ message }) => leaf095.fold(model, message),
    GotLeaf096Message: ({ message }) => leaf096.fold(model, message),
    GotLeaf097Message: ({ message }) => leaf097.fold(model, message),
    GotLeaf098Message: ({ message }) => leaf098.fold(model, message),
    GotLeaf099Message: ({ message }) => leaf099.fold(model, message),
    GotLeaf100Message: ({ message }) => leaf100.fold(model, message),
  }),
)
const view = Application.view((_model, h) => h.main([]))

export const program = Application.makeElement({
  container: null,
  init: () => ({
    model: ApplicationModel.make({ leaf: LeafModel.make({ value: 0 }) }),
  }),
  update,
  view,
  EffectsLayer: Layer.empty,
})
export const providedProgram = program.provide(ClockLayer)

export type ApplicationRequirements = Update.RequirementsOf<typeof update>
export type Program = typeof program
type RequirementsOf<Value> =
  Value extends ElementProgram<
    undefined,
    infer Requirements,
    never,
    infer _ProvidedServices
  >
    ? Requirements
    : never
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value
type ProgramRequirementsAreClock = Expect<
  Equal<RequirementsOf<typeof program>, Clock>
>
type ProvidedRequirementsAreComplete = Expect<
  Equal<RequirementsOf<typeof providedProgram>, never>
>
export type Assertions = [
  ProgramRequirementsAreClock,
  ProvidedRequirementsAreComplete,
]
