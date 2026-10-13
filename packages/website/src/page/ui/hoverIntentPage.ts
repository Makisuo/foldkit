import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as HoverIntent from './demo/hoverIntent'
import raw from './hoverIntentPage.md'
import { ui } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<
  'hover-card' | 'hover-menu'
>(raw, 'ui/hover-intent')

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
        'hover-card': demoContainer(
          ...HoverIntent.hoverCardDemo(model.hoverIntentCardDemo, h),
        ),
        'hover-menu': demoContainer(
          ...HoverIntent.hoverMenuDemo(model.hoverIntentMenuDemo, h),
        ),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
