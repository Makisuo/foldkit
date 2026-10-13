import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as RadioGroup from './demo/radioGroup'
import raw from './radioGroupPage.md'
import { ui } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<
  'vertical' | 'horizontal'
>(raw, 'ui/radio-group')

export { tableOfContents }

type ViewInputs = Readonly<{
  renderCopyButton: CodeBlock.RenderCopyButton
  renderSnippet: CodeBlock.RenderSnippet
  renderHeadingLink: RenderHeadingLink
}>

export const view = ui.view.withInputs<ViewInputs>(
  (model, { renderCopyButton, renderSnippet, renderHeadingLink }, h) =>
    renderPage({
      demos: {
        vertical: demoContainer(...RadioGroup.verticalDemo(model, h)),
        horizontal: demoContainer(...RadioGroup.horizontalDemo(model, h)),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
