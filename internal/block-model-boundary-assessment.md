# Completed Block Model boundary assessment

## Decision

Use a checked assembly producer/header for ordinary completed Block exports. Keep each feature's canonical Model Schema private and let parents compose `ChildBlock.Model`. The runtime API, Composition stages and lifecycle ownership stay unchanged.

The preferred owned assembler and the single conditional header both passed initial source checks but repeatedly made the real Website route workload slower. They are not implemented. Four shape-specific aliases give TypeScript the Model header directly without evaluating whether the completed implementation has a default view or OutMessage Schema first.

This is a material completion improvement with a diagnostic tradeoff. It is not a claim that every large composition is responsive, or that a bounded benchmark proves long-running memory stability.

## Consumer code

The canonical-import control requires another feature export and parent import:

```ts
// settings/index.ts
export { SettingsBlock } from './block'
export { Model } from './model'

// parent/model.ts
import * as Settings from './settings'

export const Model = Schema.Struct({ settings: Settings.Model })
```

The selected boundary keeps the completed value as the feature's public surface:

```ts
// settings/block.ts
import type { Block } from 'foldkit'

import { SettingsComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assembleSettingsBlock = () =>
  SettingsComposition.assembleBlock({ init, update, view })

export const SettingsBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleSettingsBlock
> = assembleSettingsBlock()

// settings/index.ts
export { SettingsBlock } from './block'

// parent/model.ts
import { SettingsBlock } from './settings'

export const Model = Schema.Struct({ settings: SettingsBlock.Model })
```

The example declares no OutMessage. A Definition that declares OutMessage selects `FromAssemblyWithViewAndOutMessage`. Without a default view, use `FromAssemblyWithOutMessage` or `FromAssemblyWithoutViewOrOutMessage`. Assembly still validates the implementation before it returns. The annotation does not replace the Schema object or construct Layers.

The extra producer is local to final assembly. Contract, behavior and view files import their local Definition or Composition, never their own completed barrel. The Model import in assembly is type-only. Existing explicit generic UI contracts and extensions retain their purposeful boundaries; they are not mechanically rewritten.

## Evidence and comparison

The control is the optimized local checkpoint based on `6724d0b2f4996dfdcefa8abae0fd278c0a8f2717`, including the provisional canonical Model imports. It is not the older slow baseline from issue #1737. Both frozen arms contain identical Website assembly payloads and parent relationships. Each arm gets coherent freshly built core/UI declarations. Measurements use official native TypeScript 7.1.0-beta, the same LSP requests, semantic checks and unchanged limits, without Go GC or memory overrides.

Three alternating pairs, twelve workloads per pair, passed all 72 fresh-process sessions. The larger workload places the Website root twice under one parent.

| Post-edit operation                          | Canonical control median | Checked header median |
| -------------------------------------------- | -----------------------: | --------------------: |
| Root member completion                       |                  2,770ms |                 181ms |
| Root hover                                   |                  2,776ms |                 181ms |
| Larger parent member completion              |                  3,507ms |                 151ms |
| Actual ChangedUrl completion                 |                    269ms |                 280ms |
| Actual ChangedUrl hover                      |                    259ms |                 290ms |
| Root error appearance                        |                  2,739ms |               3,287ms |
| Root error clearing                          |                  2,738ms |               3,273ms |
| Full Message selection and resolution        |                  2,703ms |               2,647ms |
| Larger EffectsLayer selection and resolution |                  3,556ms |               3,402ms |

Root diagnostics regress about 20%; larger diagnostics regress about 20–24%. Full Message and EffectsLayer expansion remain expensive. The actual route stays sub-second with a small measured regression. Display-aware completion adapters account for the internal computed-symbol display difference; exact members and channels are verified independently through source and declarations.

A second final encoding shares the producer constraint across eight type heads. It has no demonstrated additional speed benefit and is retained to keep one implementation of the guard. Its actual-route screen remains around 0.3s.

A final sustained run requests completion, clean full diagnostics and full semantic tokens concurrently for twenty edit rounds in each arm:

| Operation        | Canonical median (range) | Selected median (range) |
| ---------------- | -----------------------: | ----------------------: |
| Root completion  |    3,187ms (3,057–3,512) |         188ms (162–391) |
| Full diagnostics |    3,193ms (3,068–3,519) |   3,549ms (3,358–3,778) |
| Semantic tokens  |    3,186ms (3,056–3,508) |   2,840ms (2,673–2,980) |

Completion remains fast while diagnostics and tokens are in flight. Full diagnostics are 11.1% slower in this run. Peak sampled RSS is 2,566/2,416MiB; both arms stay inside the unchanged 3GiB bound. Each arm is one process with correlated rounds, not twenty independent sessions. These bounded runs do not establish a general memory reduction or absence of leaks.

The actual integrated source, including barrel cleanup, type-only imports and UI headers, passes a final ten-session spotcheck after fresh core/UI builds. This is one proportional confirmation pair, not another repeated matrix:

| Operation                              |       Canonical | Actual integration |
| -------------------------------------- | --------------: | -----------------: |
| Root post-edit completion              |         2,665ms |              162ms |
| ChangedUrl completion                  |           247ms |              274ms |
| ChangedUrl hover                       |           279ms |              256ms |
| Root error appearance / clearing       | 2,649 / 2,641ms |    3,156 / 3,153ms |
| ChangedUrl error appearance / clearing |     606 / 581ms |        594 / 564ms |

All semantic payload, source-integrity, compiler-identity and unchanged-budget guards pass. This confirms the selected completion gain and root-diagnostic regression survive the real migration; it does not extrapolate to every consumer or the user's long-lived editor session.

## Safety and internal cost

The four aliases have four constrained public backing interfaces so inferred downstream declarations remain portable. This costs eight public type names and an explicit completed-member inventory. A single conditional alias regressed the measured route workload; it is not retained for surface symmetry.

The checked header preserves the exact Model Schema, Message/Codec channels, initializer and operation arguments, refined payloads, Commands, Services, constructor errors, handler completeness, host delegation, registration evidence and default-view/OutMessage distinctions. It rejects incompatible, broad, mutable, union, extra-member and overloaded producers. Whole-any aliases are unusable; invalid carrier members use an incompatible object rather than `never`, preventing erased producers from becoming usable Blocks.

Permanent source and emitted-package fixtures cover acceptance and rejection. Removing the plain-producer constraint invalidates two permanent source rejection controls; replacing the incompatible carrier with `never` invalidates two more. Separate exhaustive proof fixtures detect thirteen and seventeen such failures. Program rejection also has other constraints; it is not claimed to be independently sensitive to that poison mutation.

Strict whole-object Composition.Message equality fails in both raw and annotated emitted controls. Exact annotated-versus-raw identity, semantic members, required keys, Codec channels and baseline-outcome parity remain tested. This boundary does not create or hide that baseline failure.

Core external source, package emission and relocated consumers pass with `skipLibCheck: false`. The real unresolved-generic Toast factory also passes source, public emission and relocated consumption, with number/string Codec channels and its test extension retained. Existing generic Toast authoring is not migrated solely to exercise this helper.

The recommended lint rule flags proven unguarded completed Model dependencies in parent Schema construction. It recognizes the checked producer/header form, immutable aliases, explicit relative barrels and known raw-returning Block methods. It does not infer arbitrary factory behavior or guess public imports. Ordinary Model access and type annotations remain allowed. This is a performance guardrail, not a new type-safety guarantee.

## Verification links

- [Checked aliases and declaration support](../packages/foldkit/src/block/fromAssembly.ts)
- [Source/runtime and adversarial checks](../packages/foldkit/src/block/fromAssembly.test.ts)
- [Emitted acceptance and exact members](../packages/foldkit/declaration-tests/from-assembly.accepted.ts)
- [Producer overload rejection](../packages/foldkit/declaration-tests/from-assembly.overloaded-producer.ts)
- [Erased carrier rejection](../packages/foldkit/declaration-tests/from-assembly.carrier-guards.ts)
- [Generic Codec and payload checks](../packages/foldkit/declaration-tests/from-assembly.generic.ts)
- [Declaration harness and relocation](../packages/foldkit/scripts/check-emitted-declarations.ts)
- [Lint implementation and provenance](../packages/oxlint-plugin-foldkit/src/rules/no-completed-block-model-in-schema.ts)
- [Real lint acceptance/rejection fixtures](../packages/oxlint-plugin-foldkit/test/integration/real-oxlint.test.ts)
- [Active organization guidance](../packages/website/src/page/projectOrganization.md)
- [Feedback dispositions and release boundary](./preview-feedback-closeout.md)

This assessment records local implementation and verification. The published Ready snapshot, deployment, package versions and three migration paths remain unchanged. A replacement preview requires separate final approval and publication verification.
