import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Popover from './demo/popover'
import raw from './popoverPage.md'
import { RegisteredUiDefinition } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<
  'basic' | 'arrow' | 'animated' | 'nested'
>(raw, 'ui/popover')

export { tableOfContents }

type ViewInputs = Readonly<{
  renderCopyButton: CodeBlock.RenderCopyButton
  renderSnippet: CodeBlock.RenderSnippet
  renderHeadingLink: RenderHeadingLink
}>

export const view = RegisteredUiDefinition.view.withInputs<ViewInputs>(
  (model, { renderCopyButton, renderSnippet, renderHeadingLink }, h) =>
    renderPage({
      demos: {
        basic: demoContainer(...Popover.basicDemo(model.popoverBasicDemo, h)),
        arrow: demoContainer(...Popover.arrowDemo(model.popoverArrowDemo, h)),
        animated: demoContainer(
          ...Popover.animatedDemo(model.popoverAnimatedDemo, h),
        ),
        nested: demoContainer(
          ...Popover.nestedDemo(
            model.popoverNestedParentDemo,
            model.popoverNestedChildDemo,
            h,
          ),
        ),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
