import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Meter from './demo/meter'
import raw from './meterPage.md'
import { RegisteredUiDefinition } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<
  'basic' | 'thresholds'
>(raw, 'ui/meter')

export { tableOfContents }

type ViewInputs = Readonly<{
  renderCopyButton: CodeBlock.RenderCopyButton
  renderSnippet: CodeBlock.RenderSnippet
  renderHeadingLink: RenderHeadingLink
}>

export const view = RegisteredUiDefinition.view.withInputs<ViewInputs>(
  (_model, { renderCopyButton, renderSnippet, renderHeadingLink }, h) =>
    renderPage({
      demos: {
        basic: demoContainer(...Meter.basicDemo(h)),
        thresholds: demoContainer(...Meter.thresholdsDemo(h)),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
