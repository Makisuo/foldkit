import { Context, Effect, Layer, Option, Schema } from 'effect'
import {
  type Element as ElementProgram,
  define as defineApplication,
  provide,
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
provide
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

const TypePerformanceWideLeaf = Block.define('TypePerformanceWideLeaf', {
  Model: LeafModel,
  Message: LeafMessage,
})
const RunLeaf = TypePerformanceWideLeaf.command('RunLeaf', {
  messages: [LeafMessage.CompletedRun],
  handler: function* () {
    const clock = yield* Clock

    return () => clock.run.pipe(Effect.as(LeafMessage.CompletedRun()))
  },
})
const runLeaf = TypePerformanceWideLeaf.step(model => ({
  model,
  commands: [RunLeaf()],
}))
const Leaf = TypePerformanceWideLeaf.assemble({
  init: () => ({ model: LeafModel.make({ value: 0 }) }),
  update: TypePerformanceWideLeaf.update((model, message) =>
    LeafMessage.match(message, {
      RequestedRun: () => runLeaf(model),
      CompletedRun: () => ({ model }),
    }),
  ),
  steps: { runLeaf },
  EffectsLayer: RunLeaf.layer,
})

const ApplicationModel = Schema.Struct({ leaf: LeafModel })
type ApplicationModel = typeof ApplicationModel.Type

// oxlint-disable foldkit/got-prefix-requires-block-payload
const ApplicationMessage = defineMessageUnion({
  GotLeaf001: { message: Leaf.Message },
  GotLeaf002: { message: Leaf.Message },
  GotLeaf003: { message: Leaf.Message },
  GotLeaf004: { message: Leaf.Message },
  GotLeaf005: { message: Leaf.Message },
  GotLeaf006: { message: Leaf.Message },
  GotLeaf007: { message: Leaf.Message },
  GotLeaf008: { message: Leaf.Message },
  GotLeaf009: { message: Leaf.Message },
  GotLeaf010: { message: Leaf.Message },
  GotLeaf011: { message: Leaf.Message },
  GotLeaf012: { message: Leaf.Message },
  GotLeaf013: { message: Leaf.Message },
  GotLeaf014: { message: Leaf.Message },
  GotLeaf015: { message: Leaf.Message },
  GotLeaf016: { message: Leaf.Message },
  GotLeaf017: { message: Leaf.Message },
  GotLeaf018: { message: Leaf.Message },
  GotLeaf019: { message: Leaf.Message },
  GotLeaf020: { message: Leaf.Message },
  GotLeaf021: { message: Leaf.Message },
  GotLeaf022: { message: Leaf.Message },
  GotLeaf023: { message: Leaf.Message },
  GotLeaf024: { message: Leaf.Message },
  GotLeaf025: { message: Leaf.Message },
  GotLeaf026: { message: Leaf.Message },
  GotLeaf027: { message: Leaf.Message },
  GotLeaf028: { message: Leaf.Message },
  GotLeaf029: { message: Leaf.Message },
  GotLeaf030: { message: Leaf.Message },
  GotLeaf031: { message: Leaf.Message },
  GotLeaf032: { message: Leaf.Message },
  GotLeaf033: { message: Leaf.Message },
  GotLeaf034: { message: Leaf.Message },
  GotLeaf035: { message: Leaf.Message },
  GotLeaf036: { message: Leaf.Message },
  GotLeaf037: { message: Leaf.Message },
  GotLeaf038: { message: Leaf.Message },
  GotLeaf039: { message: Leaf.Message },
  GotLeaf040: { message: Leaf.Message },
  GotLeaf041: { message: Leaf.Message },
  GotLeaf042: { message: Leaf.Message },
  GotLeaf043: { message: Leaf.Message },
  GotLeaf044: { message: Leaf.Message },
  GotLeaf045: { message: Leaf.Message },
  GotLeaf046: { message: Leaf.Message },
  GotLeaf047: { message: Leaf.Message },
  GotLeaf048: { message: Leaf.Message },
  GotLeaf049: { message: Leaf.Message },
  GotLeaf050: { message: Leaf.Message },
  GotLeaf051: { message: Leaf.Message },
  GotLeaf052: { message: Leaf.Message },
  GotLeaf053: { message: Leaf.Message },
  GotLeaf054: { message: Leaf.Message },
  GotLeaf055: { message: Leaf.Message },
  GotLeaf056: { message: Leaf.Message },
  GotLeaf057: { message: Leaf.Message },
  GotLeaf058: { message: Leaf.Message },
  GotLeaf059: { message: Leaf.Message },
  GotLeaf060: { message: Leaf.Message },
  GotLeaf061: { message: Leaf.Message },
  GotLeaf062: { message: Leaf.Message },
  GotLeaf063: { message: Leaf.Message },
  GotLeaf064: { message: Leaf.Message },
  GotLeaf065: { message: Leaf.Message },
  GotLeaf066: { message: Leaf.Message },
  GotLeaf067: { message: Leaf.Message },
  GotLeaf068: { message: Leaf.Message },
  GotLeaf069: { message: Leaf.Message },
  GotLeaf070: { message: Leaf.Message },
  GotLeaf071: { message: Leaf.Message },
  GotLeaf072: { message: Leaf.Message },
  GotLeaf073: { message: Leaf.Message },
  GotLeaf074: { message: Leaf.Message },
  GotLeaf075: { message: Leaf.Message },
  GotLeaf076: { message: Leaf.Message },
  GotLeaf077: { message: Leaf.Message },
  GotLeaf078: { message: Leaf.Message },
  GotLeaf079: { message: Leaf.Message },
  GotLeaf080: { message: Leaf.Message },
  GotLeaf081: { message: Leaf.Message },
  GotLeaf082: { message: Leaf.Message },
  GotLeaf083: { message: Leaf.Message },
  GotLeaf084: { message: Leaf.Message },
  GotLeaf085: { message: Leaf.Message },
  GotLeaf086: { message: Leaf.Message },
  GotLeaf087: { message: Leaf.Message },
  GotLeaf088: { message: Leaf.Message },
  GotLeaf089: { message: Leaf.Message },
  GotLeaf090: { message: Leaf.Message },
  GotLeaf091: { message: Leaf.Message },
  GotLeaf092: { message: Leaf.Message },
  GotLeaf093: { message: Leaf.Message },
  GotLeaf094: { message: Leaf.Message },
  GotLeaf095: { message: Leaf.Message },
  GotLeaf096: { message: Leaf.Message },
  GotLeaf097: { message: Leaf.Message },
  GotLeaf098: { message: Leaf.Message },
  GotLeaf099: { message: Leaf.Message },
  GotLeaf100: { message: Leaf.Message },
})
// oxlint-enable foldkit/got-prefix-requires-block-payload

const leaf001 = Leaf.connection({
  placement: 'leaf001',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf001,
})

const leaf002 = Leaf.connection({
  placement: 'leaf002',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf002,
})

const leaf003 = Leaf.connection({
  placement: 'leaf003',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf003,
})

const leaf004 = Leaf.connection({
  placement: 'leaf004',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf004,
})

const leaf005 = Leaf.connection({
  placement: 'leaf005',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf005,
})

const leaf006 = Leaf.connection({
  placement: 'leaf006',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf006,
})

const leaf007 = Leaf.connection({
  placement: 'leaf007',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf007,
})

const leaf008 = Leaf.connection({
  placement: 'leaf008',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf008,
})

const leaf009 = Leaf.connection({
  placement: 'leaf009',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf009,
})

const leaf010 = Leaf.connection({
  placement: 'leaf010',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf010,
})

const leaf011 = Leaf.connection({
  placement: 'leaf011',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf011,
})

const leaf012 = Leaf.connection({
  placement: 'leaf012',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf012,
})

const leaf013 = Leaf.connection({
  placement: 'leaf013',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf013,
})

const leaf014 = Leaf.connection({
  placement: 'leaf014',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf014,
})

const leaf015 = Leaf.connection({
  placement: 'leaf015',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf015,
})

const leaf016 = Leaf.connection({
  placement: 'leaf016',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf016,
})

const leaf017 = Leaf.connection({
  placement: 'leaf017',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf017,
})

const leaf018 = Leaf.connection({
  placement: 'leaf018',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf018,
})

const leaf019 = Leaf.connection({
  placement: 'leaf019',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf019,
})

const leaf020 = Leaf.connection({
  placement: 'leaf020',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf020,
})

const leaf021 = Leaf.connection({
  placement: 'leaf021',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf021,
})

const leaf022 = Leaf.connection({
  placement: 'leaf022',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf022,
})

const leaf023 = Leaf.connection({
  placement: 'leaf023',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf023,
})

const leaf024 = Leaf.connection({
  placement: 'leaf024',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf024,
})

const leaf025 = Leaf.connection({
  placement: 'leaf025',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf025,
})

const leaf026 = Leaf.connection({
  placement: 'leaf026',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf026,
})

const leaf027 = Leaf.connection({
  placement: 'leaf027',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf027,
})

const leaf028 = Leaf.connection({
  placement: 'leaf028',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf028,
})

const leaf029 = Leaf.connection({
  placement: 'leaf029',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf029,
})

const leaf030 = Leaf.connection({
  placement: 'leaf030',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf030,
})

const leaf031 = Leaf.connection({
  placement: 'leaf031',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf031,
})

const leaf032 = Leaf.connection({
  placement: 'leaf032',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf032,
})

const leaf033 = Leaf.connection({
  placement: 'leaf033',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf033,
})

const leaf034 = Leaf.connection({
  placement: 'leaf034',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf034,
})

const leaf035 = Leaf.connection({
  placement: 'leaf035',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf035,
})

const leaf036 = Leaf.connection({
  placement: 'leaf036',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf036,
})

const leaf037 = Leaf.connection({
  placement: 'leaf037',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf037,
})

const leaf038 = Leaf.connection({
  placement: 'leaf038',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf038,
})

const leaf039 = Leaf.connection({
  placement: 'leaf039',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf039,
})

const leaf040 = Leaf.connection({
  placement: 'leaf040',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf040,
})

const leaf041 = Leaf.connection({
  placement: 'leaf041',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf041,
})

const leaf042 = Leaf.connection({
  placement: 'leaf042',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf042,
})

const leaf043 = Leaf.connection({
  placement: 'leaf043',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf043,
})

const leaf044 = Leaf.connection({
  placement: 'leaf044',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf044,
})

const leaf045 = Leaf.connection({
  placement: 'leaf045',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf045,
})

const leaf046 = Leaf.connection({
  placement: 'leaf046',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf046,
})

const leaf047 = Leaf.connection({
  placement: 'leaf047',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf047,
})

const leaf048 = Leaf.connection({
  placement: 'leaf048',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf048,
})

const leaf049 = Leaf.connection({
  placement: 'leaf049',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf049,
})

const leaf050 = Leaf.connection({
  placement: 'leaf050',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf050,
})

const leaf051 = Leaf.connection({
  placement: 'leaf051',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf051,
})

const leaf052 = Leaf.connection({
  placement: 'leaf052',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf052,
})

const leaf053 = Leaf.connection({
  placement: 'leaf053',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf053,
})

const leaf054 = Leaf.connection({
  placement: 'leaf054',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf054,
})

const leaf055 = Leaf.connection({
  placement: 'leaf055',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf055,
})

const leaf056 = Leaf.connection({
  placement: 'leaf056',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf056,
})

const leaf057 = Leaf.connection({
  placement: 'leaf057',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf057,
})

const leaf058 = Leaf.connection({
  placement: 'leaf058',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf058,
})

const leaf059 = Leaf.connection({
  placement: 'leaf059',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf059,
})

const leaf060 = Leaf.connection({
  placement: 'leaf060',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf060,
})

const leaf061 = Leaf.connection({
  placement: 'leaf061',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf061,
})

const leaf062 = Leaf.connection({
  placement: 'leaf062',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf062,
})

const leaf063 = Leaf.connection({
  placement: 'leaf063',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf063,
})

const leaf064 = Leaf.connection({
  placement: 'leaf064',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf064,
})

const leaf065 = Leaf.connection({
  placement: 'leaf065',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf065,
})

const leaf066 = Leaf.connection({
  placement: 'leaf066',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf066,
})

const leaf067 = Leaf.connection({
  placement: 'leaf067',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf067,
})

const leaf068 = Leaf.connection({
  placement: 'leaf068',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf068,
})

const leaf069 = Leaf.connection({
  placement: 'leaf069',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf069,
})

const leaf070 = Leaf.connection({
  placement: 'leaf070',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf070,
})

const leaf071 = Leaf.connection({
  placement: 'leaf071',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf071,
})

const leaf072 = Leaf.connection({
  placement: 'leaf072',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf072,
})

const leaf073 = Leaf.connection({
  placement: 'leaf073',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf073,
})

const leaf074 = Leaf.connection({
  placement: 'leaf074',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf074,
})

const leaf075 = Leaf.connection({
  placement: 'leaf075',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf075,
})

const leaf076 = Leaf.connection({
  placement: 'leaf076',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf076,
})

const leaf077 = Leaf.connection({
  placement: 'leaf077',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf077,
})

const leaf078 = Leaf.connection({
  placement: 'leaf078',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf078,
})

const leaf079 = Leaf.connection({
  placement: 'leaf079',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf079,
})

const leaf080 = Leaf.connection({
  placement: 'leaf080',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf080,
})

const leaf081 = Leaf.connection({
  placement: 'leaf081',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf081,
})

const leaf082 = Leaf.connection({
  placement: 'leaf082',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf082,
})

const leaf083 = Leaf.connection({
  placement: 'leaf083',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf083,
})

const leaf084 = Leaf.connection({
  placement: 'leaf084',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf084,
})

const leaf085 = Leaf.connection({
  placement: 'leaf085',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf085,
})

const leaf086 = Leaf.connection({
  placement: 'leaf086',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf086,
})

const leaf087 = Leaf.connection({
  placement: 'leaf087',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf087,
})

const leaf088 = Leaf.connection({
  placement: 'leaf088',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf088,
})

const leaf089 = Leaf.connection({
  placement: 'leaf089',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf089,
})

const leaf090 = Leaf.connection({
  placement: 'leaf090',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf090,
})

const leaf091 = Leaf.connection({
  placement: 'leaf091',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf091,
})

const leaf092 = Leaf.connection({
  placement: 'leaf092',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf092,
})

const leaf093 = Leaf.connection({
  placement: 'leaf093',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf093,
})

const leaf094 = Leaf.connection({
  placement: 'leaf094',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf094,
})

const leaf095 = Leaf.connection({
  placement: 'leaf095',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf095,
})

const leaf096 = Leaf.connection({
  placement: 'leaf096',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf096,
})

const leaf097 = Leaf.connection({
  placement: 'leaf097',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf097,
})

const leaf098 = Leaf.connection({
  placement: 'leaf098',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf098,
})

const leaf099 = Leaf.connection({
  placement: 'leaf099',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf099,
})

const leaf100 = Leaf.connection({
  placement: 'leaf100',
  read: (model: ApplicationModel) => Option.some(model.leaf),
  write: (_model: ApplicationModel, nextLeaf: LeafModel) =>
    ApplicationModel.make({ leaf: nextLeaf }),
  parentMessage: ApplicationMessage.GotLeaf100,
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
    GotLeaf001: ({ message }) => leaf001.fold(model, message),
    GotLeaf002: ({ message }) => leaf002.fold(model, message),
    GotLeaf003: ({ message }) => leaf003.fold(model, message),
    GotLeaf004: ({ message }) => leaf004.fold(model, message),
    GotLeaf005: ({ message }) => leaf005.fold(model, message),
    GotLeaf006: ({ message }) => leaf006.fold(model, message),
    GotLeaf007: ({ message }) => leaf007.fold(model, message),
    GotLeaf008: ({ message }) => leaf008.fold(model, message),
    GotLeaf009: ({ message }) => leaf009.fold(model, message),
    GotLeaf010: ({ message }) => leaf010.fold(model, message),
    GotLeaf011: ({ message }) => leaf011.fold(model, message),
    GotLeaf012: ({ message }) => leaf012.fold(model, message),
    GotLeaf013: ({ message }) => leaf013.fold(model, message),
    GotLeaf014: ({ message }) => leaf014.fold(model, message),
    GotLeaf015: ({ message }) => leaf015.fold(model, message),
    GotLeaf016: ({ message }) => leaf016.fold(model, message),
    GotLeaf017: ({ message }) => leaf017.fold(model, message),
    GotLeaf018: ({ message }) => leaf018.fold(model, message),
    GotLeaf019: ({ message }) => leaf019.fold(model, message),
    GotLeaf020: ({ message }) => leaf020.fold(model, message),
    GotLeaf021: ({ message }) => leaf021.fold(model, message),
    GotLeaf022: ({ message }) => leaf022.fold(model, message),
    GotLeaf023: ({ message }) => leaf023.fold(model, message),
    GotLeaf024: ({ message }) => leaf024.fold(model, message),
    GotLeaf025: ({ message }) => leaf025.fold(model, message),
    GotLeaf026: ({ message }) => leaf026.fold(model, message),
    GotLeaf027: ({ message }) => leaf027.fold(model, message),
    GotLeaf028: ({ message }) => leaf028.fold(model, message),
    GotLeaf029: ({ message }) => leaf029.fold(model, message),
    GotLeaf030: ({ message }) => leaf030.fold(model, message),
    GotLeaf031: ({ message }) => leaf031.fold(model, message),
    GotLeaf032: ({ message }) => leaf032.fold(model, message),
    GotLeaf033: ({ message }) => leaf033.fold(model, message),
    GotLeaf034: ({ message }) => leaf034.fold(model, message),
    GotLeaf035: ({ message }) => leaf035.fold(model, message),
    GotLeaf036: ({ message }) => leaf036.fold(model, message),
    GotLeaf037: ({ message }) => leaf037.fold(model, message),
    GotLeaf038: ({ message }) => leaf038.fold(model, message),
    GotLeaf039: ({ message }) => leaf039.fold(model, message),
    GotLeaf040: ({ message }) => leaf040.fold(model, message),
    GotLeaf041: ({ message }) => leaf041.fold(model, message),
    GotLeaf042: ({ message }) => leaf042.fold(model, message),
    GotLeaf043: ({ message }) => leaf043.fold(model, message),
    GotLeaf044: ({ message }) => leaf044.fold(model, message),
    GotLeaf045: ({ message }) => leaf045.fold(model, message),
    GotLeaf046: ({ message }) => leaf046.fold(model, message),
    GotLeaf047: ({ message }) => leaf047.fold(model, message),
    GotLeaf048: ({ message }) => leaf048.fold(model, message),
    GotLeaf049: ({ message }) => leaf049.fold(model, message),
    GotLeaf050: ({ message }) => leaf050.fold(model, message),
    GotLeaf051: ({ message }) => leaf051.fold(model, message),
    GotLeaf052: ({ message }) => leaf052.fold(model, message),
    GotLeaf053: ({ message }) => leaf053.fold(model, message),
    GotLeaf054: ({ message }) => leaf054.fold(model, message),
    GotLeaf055: ({ message }) => leaf055.fold(model, message),
    GotLeaf056: ({ message }) => leaf056.fold(model, message),
    GotLeaf057: ({ message }) => leaf057.fold(model, message),
    GotLeaf058: ({ message }) => leaf058.fold(model, message),
    GotLeaf059: ({ message }) => leaf059.fold(model, message),
    GotLeaf060: ({ message }) => leaf060.fold(model, message),
    GotLeaf061: ({ message }) => leaf061.fold(model, message),
    GotLeaf062: ({ message }) => leaf062.fold(model, message),
    GotLeaf063: ({ message }) => leaf063.fold(model, message),
    GotLeaf064: ({ message }) => leaf064.fold(model, message),
    GotLeaf065: ({ message }) => leaf065.fold(model, message),
    GotLeaf066: ({ message }) => leaf066.fold(model, message),
    GotLeaf067: ({ message }) => leaf067.fold(model, message),
    GotLeaf068: ({ message }) => leaf068.fold(model, message),
    GotLeaf069: ({ message }) => leaf069.fold(model, message),
    GotLeaf070: ({ message }) => leaf070.fold(model, message),
    GotLeaf071: ({ message }) => leaf071.fold(model, message),
    GotLeaf072: ({ message }) => leaf072.fold(model, message),
    GotLeaf073: ({ message }) => leaf073.fold(model, message),
    GotLeaf074: ({ message }) => leaf074.fold(model, message),
    GotLeaf075: ({ message }) => leaf075.fold(model, message),
    GotLeaf076: ({ message }) => leaf076.fold(model, message),
    GotLeaf077: ({ message }) => leaf077.fold(model, message),
    GotLeaf078: ({ message }) => leaf078.fold(model, message),
    GotLeaf079: ({ message }) => leaf079.fold(model, message),
    GotLeaf080: ({ message }) => leaf080.fold(model, message),
    GotLeaf081: ({ message }) => leaf081.fold(model, message),
    GotLeaf082: ({ message }) => leaf082.fold(model, message),
    GotLeaf083: ({ message }) => leaf083.fold(model, message),
    GotLeaf084: ({ message }) => leaf084.fold(model, message),
    GotLeaf085: ({ message }) => leaf085.fold(model, message),
    GotLeaf086: ({ message }) => leaf086.fold(model, message),
    GotLeaf087: ({ message }) => leaf087.fold(model, message),
    GotLeaf088: ({ message }) => leaf088.fold(model, message),
    GotLeaf089: ({ message }) => leaf089.fold(model, message),
    GotLeaf090: ({ message }) => leaf090.fold(model, message),
    GotLeaf091: ({ message }) => leaf091.fold(model, message),
    GotLeaf092: ({ message }) => leaf092.fold(model, message),
    GotLeaf093: ({ message }) => leaf093.fold(model, message),
    GotLeaf094: ({ message }) => leaf094.fold(model, message),
    GotLeaf095: ({ message }) => leaf095.fold(model, message),
    GotLeaf096: ({ message }) => leaf096.fold(model, message),
    GotLeaf097: ({ message }) => leaf097.fold(model, message),
    GotLeaf098: ({ message }) => leaf098.fold(model, message),
    GotLeaf099: ({ message }) => leaf099.fold(model, message),
    GotLeaf100: ({ message }) => leaf100.fold(model, message),
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
export const providedProgram = provide(program, ClockLayer)

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
