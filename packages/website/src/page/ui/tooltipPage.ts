import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Tooltip from './demo/tooltip'
import raw from './tooltipPage.md'
import { UiComposition } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<'demo'>(
  raw,
  'ui/tooltip',
)

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
        demo: demoContainer(...Tooltip.demo(model.tooltipDemo, h)),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
