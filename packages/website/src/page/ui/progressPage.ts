import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Progress from './demo/progress'
import raw from './progressPage.md'
import { ui } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<
  'basic' | 'indeterminate'
>(raw, 'ui/progress')

export { tableOfContents }

type ViewInputs = Readonly<{
  renderCopyButton: CodeBlock.RenderCopyButton
  renderSnippet: CodeBlock.RenderSnippet
  renderHeadingLink: RenderHeadingLink
}>

export const view = ui.view.withInputs<ViewInputs>(
  (_model, { renderCopyButton, renderSnippet, renderHeadingLink }, h) =>
    renderPage({
      demos: {
        basic: demoContainer(...Progress.basicDemo(h)),
        indeterminate: demoContainer(...Progress.indeterminateDemo(h)),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
