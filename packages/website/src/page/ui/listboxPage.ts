import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as Listbox from './demo/listbox'
import raw from './listboxPage.md'
import { ui } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<
  'basic' | 'multi-select' | 'grouped'
>(raw, 'ui/listbox')

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
        basic: demoContainer(
          ...Listbox.basicDemo(
            model.listboxDemo,
            model.maybeListboxDemoSelectedItem,
            h,
          ),
        ),
        'multi-select': demoContainer(
          ...Listbox.multiSelectDemo(
            model.listboxMultiDemo,
            model.listboxMultiDemoSelectedItems,
            h,
          ),
        ),
        grouped: demoContainer(
          ...Listbox.groupedDemo(
            model.listboxGroupedDemo,
            model.maybeListboxGroupedDemoSelectedItem,
            h,
          ),
        ),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
