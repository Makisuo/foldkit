import type { Block } from 'foldkit'
import { type Html } from 'foldkit/html'

import type { RenderInfo as DialogRenderInfo } from '@foldkit/ui/dialog'

import { RegisteredUiDefinition, mobileMenuDialog } from '../update'

export type ViewInputs = Readonly<{
  renderContent: (
    closeButton: DialogRenderInfo['closeButton'],
    h: Block.HtmlBuilderOf<typeof RegisteredUiDefinition>,
  ) => Html
}>

export const view = RegisteredUiDefinition.view.withInputs<ViewInputs>(
  (model, { renderContent }, h) => {
    const mobileMenuDialogContent = ({
      dialog,
      backdrop,
      panel,
      closeButton,
      isVisible,
    }: DialogRenderInfo): Html =>
      h.dialog(
        [...dialog, h.Class('md:hidden')],
        isVisible
          ? [
              h.div([...backdrop, h.Class('fixed inset-0 z-[59]')]),
              h.div(
                [
                  ...panel,
                  h.Class('fixed inset-0 z-[60] bg-white flex flex-col'),
                ],
                [renderContent(closeButton, h)],
              ),
            ]
          : [],
      )

    return h.block(
      mobileMenuDialog.embedView({
        slotId: model.mobileMenuDialog.id,
        model: model.mobileMenuDialog,
        viewInputs: { toView: mobileMenuDialogContent },
      }),
    )
  },
)
