import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Input from './demo/input'
import raw from './inputPage.md'
import { ui } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<'basic' | 'disabled'>(
  raw,
  'ui/input',
)

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
        basic: demoContainer(...Input.basicDemo(model, h)),
        disabled: demoContainer(...Input.disabledDemo(model, h)),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
