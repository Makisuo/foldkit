import { Option } from 'effect'
import { Block, Runtime } from 'foldkit'

import { ApplicationComposition } from './composition'
import { Model } from './model'

type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
type ApplicationMessage = typeof ApplicationComposition.Message.Type

export const statusView = (model: Model, h: ApplicationViewBuilder) =>
  h.output([], [model.status])

export const reportCrash = ({
  error,
  message,
}: Runtime.CrashContext<Model, ApplicationMessage>) => {
  reportError(error, {
    message: Option.getOrUndefined(message),
  })
}
