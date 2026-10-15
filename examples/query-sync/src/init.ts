import { type Url } from 'foldkit/url'

import { Application } from './definition'
import { DietListbox, PeriodListbox } from './model'
import { urlToApplicationRoute } from './route'

export const init = Application.init((url: Url) => {
  const route = urlToApplicationRoute(url)

  return {
    model: {
      route,
      dietListbox: DietListbox.init({ id: 'diet-filter' }).model,
      periodListbox: PeriodListbox.init({ id: 'period-filter' }).model,
    },
  }
})
