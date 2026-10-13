import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Fieldset from './demo/fieldset'
import raw from './fieldsetPage.md'
import { ui } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<'basic' | 'disabled'>(
  raw,
  'ui/fieldset',
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
        basic: demoContainer(...Fieldset.basicDemo(model, h)),
        disabled: demoContainer(...Fieldset.disabledDemo(model, h)),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
