import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Menu from './demo/menu'
import raw from './menuPage.md'
import { ui } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<'basic' | 'animated'>(
  raw,
  'ui/menu',
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
        basic: demoContainer(...Menu.basicDemo(model.menuBasicDemo, h)),
        animated: demoContainer(
          ...Menu.animatedDemo(model.menuAnimatedDemo, h),
        ),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
