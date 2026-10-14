import { type CodeBlock } from '../../component'
import { slotDocPage } from '../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../prose'
import * as DragAndDrop from './demo/dragAndDrop'
import raw from './dragAndDropPage.md'
import { RegisteredUiDefinition } from './update'

const { tableOfContents, view: renderPage } = slotDocPage<'demo'>(
  raw,
  'ui/drag-and-drop',
)

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
        demo: demoContainer(...DragAndDrop.demo(model, h)),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
