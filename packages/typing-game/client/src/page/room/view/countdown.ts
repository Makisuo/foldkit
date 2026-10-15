import { Option } from 'effect'
import { Html } from 'foldkit/html'

import type { ViewBuilder } from '../definition'

export const countdown = (
  secondsLeft: number,
  maybeGameText: Option.Option<string>,
  h: ViewBuilder,
): Html =>
  h.div(
    [h.Class('space-y-6')],
    [
      h.h3([h.Class('uppercase')], [`Starting in ${secondsLeft}...`]),
      Option.match(maybeGameText, {
        onNone: () => h.empty,
        onSome: text => h.div([], [text]),
      }),
    ],
  )
