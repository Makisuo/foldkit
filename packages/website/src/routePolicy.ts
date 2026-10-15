import { Option, pipe } from 'effect'
import { Update } from 'foldkit'
import { Transition } from 'foldkit/route'
import { modifyFields } from 'foldkit/struct'

import { apiReference, exampleDetail, home, playground } from './composition'
import { Application } from './definition'
import { findActiveSectionKey } from './docsNav'
import { type Model } from './model'
import { ApplicationRoute } from './route'
import { type GroupKey } from './sidebarStorage'

export type ApplicationTransition = Transition.Transition<ApplicationRoute>

export const maybeExampleSlugForRoute = (
  route: ApplicationRoute,
): Option.Option<string> =>
  pipe(
    route,
    Option.liftPredicate(ApplicationRoute.guards.ExampleDetail),
    Option.map(({ exampleSlug }) => exampleSlug),
  )

export const maybeActiveSectionKeyForRoute = (
  route: ApplicationRoute,
): Option.Option<GroupKey> =>
  findActiveSectionKey(route._tag, maybeExampleSlugForRoute(route))

export const maybeHomeRouteToInitialize = (transition: ApplicationTransition) =>
  Transition.entered(transition, 'Home')

export const maybePlaygroundRouteToInitialize = (
  transition: ApplicationTransition,
) =>
  Option.orElse(Transition.entered(transition, 'Playground'), () =>
    pipe(
      Transition.stayed(transition, 'Playground'),
      Option.filter(
        ({ previousRoute, nextRoute }) =>
          previousRoute.exampleSlug !== nextRoute.exampleSlug,
      ),
      Option.map(({ nextRoute }) => nextRoute),
    ),
  )

const reconcileHome = (transition: ApplicationTransition) => (model: Model) => {
  if (Option.isSome(maybeHomeRouteToInitialize(transition))) {
    const homeInit = home.init()
    const nextModel = modifyFields(model, {
      maybeHome: () => Option.some(homeInit.model),
    })

    return homeInit.commands === undefined
      ? { model: nextModel }
      : { model: nextModel, commands: homeInit.commands }
  }

  if (Option.isSome(Transition.exited(transition, 'Home'))) {
    return {
      model: modifyFields(model, { maybeHome: () => Option.none() }),
    }
  }

  return { model }
}

const reconcilePlayground =
  (
    transition: ApplicationTransition,
    maybeIsPlaygroundSupported: Option.Option<boolean>,
  ) =>
  (model: Model) =>
    Option.match(maybePlaygroundRouteToInitialize(transition), {
      onSome: ({ exampleSlug }) => {
        const playgroundInit = playground.init(
          exampleSlug,
          maybeIsPlaygroundSupported,
        )
        const nextModel = modifyFields(model, {
          playground: () => Option.some(playgroundInit.model),
        })

        return playgroundInit.commands === undefined
          ? { model: nextModel }
          : { model: nextModel, commands: playgroundInit.commands }
      },
      onNone: () =>
        ApplicationRoute.guards.Playground(transition.nextRoute)
          ? { model }
          : {
              model: modifyFields(model, {
                playground: () => Option.none(),
              }),
            },
    })

export const reconcileRoutedChildModels = (
  transition: ApplicationTransition,
  maybeIsPlaygroundSupported: Option.Option<boolean> = Option.none(),
) =>
  Application.step(model =>
    Update.combine(model, [
      reconcileHome(transition),
      reconcilePlayground(transition, maybeIsPlaygroundSupported),
    ]),
  )

const maybeApiModuleRouteToInform = (transition: ApplicationTransition) =>
  Option.orElse(Transition.entered(transition, 'ApiModule'), () =>
    pipe(
      Transition.stayed(transition, 'ApiModule'),
      Option.filter(
        ({ previousRoute, nextRoute }) =>
          previousRoute.moduleSlug !== nextRoute.moduleSlug,
      ),
      Option.map(({ nextRoute }) => nextRoute),
    ),
  )

const maybeExampleRouteToInform = (transition: ApplicationTransition) =>
  Option.orElse(Transition.entered(transition, 'ExampleDetail'), () =>
    pipe(
      Transition.stayed(transition, 'ExampleDetail'),
      Option.filter(
        ({ previousRoute, nextRoute }) =>
          previousRoute.exampleSlug !== nextRoute.exampleSlug,
      ),
      Option.map(({ nextRoute }) => nextRoute),
    ),
  )

export const routeDataLoadingSteps = (transition: ApplicationTransition) => [
  ...Option.match(maybeApiModuleRouteToInform(transition), {
    onNone: () => [],
    onSome: () => [apiReference.informRouteChanged()],
  }),
  ...Option.match(maybeExampleRouteToInform(transition), {
    onNone: () => [],
    onSome: ({ exampleSlug }) => [
      exampleDetail.informRouteChanged(exampleSlug),
    ],
  }),
]
