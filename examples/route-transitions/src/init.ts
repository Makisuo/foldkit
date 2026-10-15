import { Option } from 'effect'
import { Transition } from 'foldkit/route'
import type { Url } from 'foldkit/url'

import { Application } from './definition'
import { Model, PaintingStatus } from './model'
import { urlToApplicationRoute } from './route'
import { handleTransition } from './transition'

export const init = Application.init((url: Url) => {
  const route = urlToApplicationRoute(url)
  const initialModel = Model.make({
    route,
    transitionLog: [],
    catalogStatus: 'Idle',
    paintingStatus: PaintingStatus.Idle(),
    studioDraft: '',
    maybeSavedDraft: Option.none(),
  })
  return handleTransition(initialModel, Transition.coldLoad(route))
})
