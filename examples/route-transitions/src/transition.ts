import { Array, Option, pipe } from 'effect'
import { Update } from 'foldkit'
import { Transition } from 'foldkit/route'
import { modifyFields } from 'foldkit/struct'

import { LoadCatalog, LoadPainting, SaveDraft } from './command'
import { ApplicationDefinition } from './definition'
import { type LoggedTransition, type Model, PaintingStatus } from './model'
import { type ApplicationRoute } from './route'

const MAX_LOGGED_TRANSITIONS = 20

export type AppTransition = Transition.Transition<typeof ApplicationRoute.Type>

const nextSequenceNumber = (
  transitionLog: ReadonlyArray<typeof LoggedTransition.Type>,
): number =>
  Option.match(Array.head(transitionLog), {
    onNone: () => 1,
    onSome: newestEntry => newestEntry.sequenceNumber + 1,
  })

const logTransition = (transition: AppTransition) =>
  ApplicationDefinition.stepFields(() => ({
    transitionLog: transitionLog =>
      pipe(
        transitionLog,
        Array.prepend({
          sequenceNumber: nextSequenceNumber(transitionLog),
          maybePreviousRoute: transition.maybePreviousRoute,
          nextRoute: transition.nextRoute,
        }),
        Array.take(MAX_LOGGED_TRANSITIONS),
      ),
  }))

const loadCatalogOnGalleryEntry = (transition: AppTransition) =>
  ApplicationDefinition.step(model =>
    Transition.isEntering(transition, 'Gallery') &&
    model.catalogStatus !== 'Loading'
      ? {
          model: modifyFields(model, { catalogStatus: () => 'Loading' }),
          commands: [LoadCatalog()],
        }
      : { model },
  )

const loadPaintingOnEntry = (transition: AppTransition) =>
  ApplicationDefinition.step(model =>
    Option.match(Transition.entered(transition, 'Painting'), {
      onNone: () => ({ model }),
      onSome: ({ paintingId }) => ({
        model: modifyFields(model, {
          paintingStatus: () => PaintingStatus.Loading({ paintingId }),
        }),
        commands: [LoadPainting({ paintingId })],
      }),
    }),
  )

const reloadPaintingOnIdChange = (transition: AppTransition) =>
  ApplicationDefinition.step(model =>
    Option.match(Transition.stayed(transition, 'Painting'), {
      onNone: () => ({ model }),
      onSome: ({ previousRoute, nextRoute }) =>
        previousRoute.paintingId === nextRoute.paintingId
          ? { model }
          : {
              model: modifyFields(model, {
                paintingStatus: () =>
                  PaintingStatus.Loading({
                    paintingId: nextRoute.paintingId,
                  }),
              }),
              commands: [LoadPainting({ paintingId: nextRoute.paintingId })],
            },
    }),
  )

const saveDraftOnStudioExit = (transition: AppTransition) =>
  ApplicationDefinition.step(model =>
    Option.match(Transition.exited(transition, 'Studio'), {
      onNone: () => ({ model }),
      onSome: () =>
        model.studioDraft === ''
          ? { model }
          : { model, commands: [SaveDraft({ draft: model.studioDraft })] },
    }),
  )

export const handleTransition = (
  model: typeof Model.Type,
  transition: AppTransition,
) =>
  Update.combineSteps(model, [
    logTransition(transition),
    loadCatalogOnGalleryEntry(transition),
    loadPaintingOnEntry(transition),
    reloadPaintingOnIdChange(transition),
    saveDraftOnStudioExit(transition),
  ])
