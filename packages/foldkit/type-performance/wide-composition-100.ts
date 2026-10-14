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
const Leaf = TypePerformanceWideLeafDefinition.toComposition().toBlock({
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

const ApplicationDefinition = defineApplication({
  Model: ApplicationModel,
  Message: ApplicationMessage,
})

const leaf001 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf001',
  parentMessage: ApplicationMessage.GotLeaf001Message,
})

const leaf002 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf002',
  parentMessage: ApplicationMessage.GotLeaf002Message,
})

const leaf003 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf003',
  parentMessage: ApplicationMessage.GotLeaf003Message,
})

const leaf004 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf004',
  parentMessage: ApplicationMessage.GotLeaf004Message,
})

const leaf005 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf005',
  parentMessage: ApplicationMessage.GotLeaf005Message,
})

const leaf006 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf006',
  parentMessage: ApplicationMessage.GotLeaf006Message,
})

const leaf007 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf007',
  parentMessage: ApplicationMessage.GotLeaf007Message,
})

const leaf008 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf008',
  parentMessage: ApplicationMessage.GotLeaf008Message,
})

const leaf009 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf009',
  parentMessage: ApplicationMessage.GotLeaf009Message,
})

const leaf010 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf010',
  parentMessage: ApplicationMessage.GotLeaf010Message,
})

const leaf011 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf011',
  parentMessage: ApplicationMessage.GotLeaf011Message,
})

const leaf012 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf012',
  parentMessage: ApplicationMessage.GotLeaf012Message,
})

const leaf013 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf013',
  parentMessage: ApplicationMessage.GotLeaf013Message,
})

const leaf014 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf014',
  parentMessage: ApplicationMessage.GotLeaf014Message,
})

const leaf015 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf015',
  parentMessage: ApplicationMessage.GotLeaf015Message,
})

const leaf016 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf016',
  parentMessage: ApplicationMessage.GotLeaf016Message,
})

const leaf017 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf017',
  parentMessage: ApplicationMessage.GotLeaf017Message,
})

const leaf018 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf018',
  parentMessage: ApplicationMessage.GotLeaf018Message,
})

const leaf019 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf019',
  parentMessage: ApplicationMessage.GotLeaf019Message,
})

const leaf020 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf020',
  parentMessage: ApplicationMessage.GotLeaf020Message,
})

const leaf021 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf021',
  parentMessage: ApplicationMessage.GotLeaf021Message,
})

const leaf022 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf022',
  parentMessage: ApplicationMessage.GotLeaf022Message,
})

const leaf023 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf023',
  parentMessage: ApplicationMessage.GotLeaf023Message,
})

const leaf024 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf024',
  parentMessage: ApplicationMessage.GotLeaf024Message,
})

const leaf025 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf025',
  parentMessage: ApplicationMessage.GotLeaf025Message,
})

const leaf026 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf026',
  parentMessage: ApplicationMessage.GotLeaf026Message,
})

const leaf027 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf027',
  parentMessage: ApplicationMessage.GotLeaf027Message,
})

const leaf028 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf028',
  parentMessage: ApplicationMessage.GotLeaf028Message,
})

const leaf029 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf029',
  parentMessage: ApplicationMessage.GotLeaf029Message,
})

const leaf030 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf030',
  parentMessage: ApplicationMessage.GotLeaf030Message,
})

const leaf031 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf031',
  parentMessage: ApplicationMessage.GotLeaf031Message,
})

const leaf032 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf032',
  parentMessage: ApplicationMessage.GotLeaf032Message,
})

const leaf033 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf033',
  parentMessage: ApplicationMessage.GotLeaf033Message,
})

const leaf034 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf034',
  parentMessage: ApplicationMessage.GotLeaf034Message,
})

const leaf035 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf035',
  parentMessage: ApplicationMessage.GotLeaf035Message,
})

const leaf036 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf036',
  parentMessage: ApplicationMessage.GotLeaf036Message,
})

const leaf037 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf037',
  parentMessage: ApplicationMessage.GotLeaf037Message,
})

const leaf038 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf038',
  parentMessage: ApplicationMessage.GotLeaf038Message,
})

const leaf039 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf039',
  parentMessage: ApplicationMessage.GotLeaf039Message,
})

const leaf040 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf040',
  parentMessage: ApplicationMessage.GotLeaf040Message,
})

const leaf041 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf041',
  parentMessage: ApplicationMessage.GotLeaf041Message,
})

const leaf042 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf042',
  parentMessage: ApplicationMessage.GotLeaf042Message,
})

const leaf043 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf043',
  parentMessage: ApplicationMessage.GotLeaf043Message,
})

const leaf044 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf044',
  parentMessage: ApplicationMessage.GotLeaf044Message,
})

const leaf045 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf045',
  parentMessage: ApplicationMessage.GotLeaf045Message,
})

const leaf046 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf046',
  parentMessage: ApplicationMessage.GotLeaf046Message,
})

const leaf047 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf047',
  parentMessage: ApplicationMessage.GotLeaf047Message,
})

const leaf048 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf048',
  parentMessage: ApplicationMessage.GotLeaf048Message,
})

const leaf049 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf049',
  parentMessage: ApplicationMessage.GotLeaf049Message,
})

const leaf050 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf050',
  parentMessage: ApplicationMessage.GotLeaf050Message,
})

const leaf051 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf051',
  parentMessage: ApplicationMessage.GotLeaf051Message,
})

const leaf052 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf052',
  parentMessage: ApplicationMessage.GotLeaf052Message,
})

const leaf053 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf053',
  parentMessage: ApplicationMessage.GotLeaf053Message,
})

const leaf054 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf054',
  parentMessage: ApplicationMessage.GotLeaf054Message,
})

const leaf055 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf055',
  parentMessage: ApplicationMessage.GotLeaf055Message,
})

const leaf056 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf056',
  parentMessage: ApplicationMessage.GotLeaf056Message,
})

const leaf057 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf057',
  parentMessage: ApplicationMessage.GotLeaf057Message,
})

const leaf058 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf058',
  parentMessage: ApplicationMessage.GotLeaf058Message,
})

const leaf059 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf059',
  parentMessage: ApplicationMessage.GotLeaf059Message,
})

const leaf060 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf060',
  parentMessage: ApplicationMessage.GotLeaf060Message,
})

const leaf061 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf061',
  parentMessage: ApplicationMessage.GotLeaf061Message,
})

const leaf062 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf062',
  parentMessage: ApplicationMessage.GotLeaf062Message,
})

const leaf063 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf063',
  parentMessage: ApplicationMessage.GotLeaf063Message,
})

const leaf064 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf064',
  parentMessage: ApplicationMessage.GotLeaf064Message,
})

const leaf065 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf065',
  parentMessage: ApplicationMessage.GotLeaf065Message,
})

const leaf066 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf066',
  parentMessage: ApplicationMessage.GotLeaf066Message,
})

const leaf067 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf067',
  parentMessage: ApplicationMessage.GotLeaf067Message,
})

const leaf068 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf068',
  parentMessage: ApplicationMessage.GotLeaf068Message,
})

const leaf069 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf069',
  parentMessage: ApplicationMessage.GotLeaf069Message,
})

const leaf070 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf070',
  parentMessage: ApplicationMessage.GotLeaf070Message,
})

const leaf071 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf071',
  parentMessage: ApplicationMessage.GotLeaf071Message,
})

const leaf072 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf072',
  parentMessage: ApplicationMessage.GotLeaf072Message,
})

const leaf073 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf073',
  parentMessage: ApplicationMessage.GotLeaf073Message,
})

const leaf074 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf074',
  parentMessage: ApplicationMessage.GotLeaf074Message,
})

const leaf075 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf075',
  parentMessage: ApplicationMessage.GotLeaf075Message,
})

const leaf076 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf076',
  parentMessage: ApplicationMessage.GotLeaf076Message,
})

const leaf077 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf077',
  parentMessage: ApplicationMessage.GotLeaf077Message,
})

const leaf078 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf078',
  parentMessage: ApplicationMessage.GotLeaf078Message,
})

const leaf079 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf079',
  parentMessage: ApplicationMessage.GotLeaf079Message,
})

const leaf080 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf080',
  parentMessage: ApplicationMessage.GotLeaf080Message,
})

const leaf081 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf081',
  parentMessage: ApplicationMessage.GotLeaf081Message,
})

const leaf082 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf082',
  parentMessage: ApplicationMessage.GotLeaf082Message,
})

const leaf083 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf083',
  parentMessage: ApplicationMessage.GotLeaf083Message,
})

const leaf084 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf084',
  parentMessage: ApplicationMessage.GotLeaf084Message,
})

const leaf085 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf085',
  parentMessage: ApplicationMessage.GotLeaf085Message,
})

const leaf086 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf086',
  parentMessage: ApplicationMessage.GotLeaf086Message,
})

const leaf087 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf087',
  parentMessage: ApplicationMessage.GotLeaf087Message,
})

const leaf088 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf088',
  parentMessage: ApplicationMessage.GotLeaf088Message,
})

const leaf089 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf089',
  parentMessage: ApplicationMessage.GotLeaf089Message,
})

const leaf090 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf090',
  parentMessage: ApplicationMessage.GotLeaf090Message,
})

const leaf091 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf091',
  parentMessage: ApplicationMessage.GotLeaf091Message,
})

const leaf092 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf092',
  parentMessage: ApplicationMessage.GotLeaf092Message,
})

const leaf093 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf093',
  parentMessage: ApplicationMessage.GotLeaf093Message,
})

const leaf094 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf094',
  parentMessage: ApplicationMessage.GotLeaf094Message,
})

const leaf095 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf095',
  parentMessage: ApplicationMessage.GotLeaf095Message,
})

const leaf096 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf096',
  parentMessage: ApplicationMessage.GotLeaf096Message,
})

const leaf097 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf097',
  parentMessage: ApplicationMessage.GotLeaf097Message,
})

const leaf098 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf098',
  parentMessage: ApplicationMessage.GotLeaf098Message,
})

const leaf099 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf099',
  parentMessage: ApplicationMessage.GotLeaf099Message,
})

const leaf100 = ApplicationDefinition.bindChild(Leaf, {
  field: 'leaf',
  placement: 'leaf100',
  parentMessage: ApplicationMessage.GotLeaf100Message,
})

const Application = ApplicationDefinition.toComposition({
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
