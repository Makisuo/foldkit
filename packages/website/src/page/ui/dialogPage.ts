import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Dialog from './demo/dialog'
import raw from './dialogPage.md'
import { UiComposition } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<
  'dialog' | 'animated' | 'overlay' | 'nested'
>(raw, 'ui/dialog')

export { tableOfContents }

type ViewInputs = Readonly<{
  renderCopyButton: CodeBlock.RenderCopyButton
  renderSnippet: CodeBlock.RenderSnippet
  renderHeadingLink: RenderHeadingLink
}>

export const view = UiComposition.view.withInputs<ViewInputs>(
  (model, { renderCopyButton, renderSnippet, renderHeadingLink }, h) =>
    renderPage({
      demos: {
        dialog: demoContainer(...Dialog.view(model.dialogDemo, h)),
        animated: demoContainer(
          ...Dialog.dialogAnimatedDemo(model.dialogAnimatedDemo, h),
        ),
        overlay: demoContainer(
          ...Dialog.overlayDialogDemo(
            model.overlayDialogDemo,
            model.overlayComboboxDemo,
            model.maybeOverlayComboboxDemoSelectedCity,
            h,
          ),
        ),
        nested: demoContainer(
          ...Dialog.nestedDialogDemo(
            model.nestedDialogParentDemo,
            model.nestedDialogChildDemo,
            h,
          ),
        ),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
