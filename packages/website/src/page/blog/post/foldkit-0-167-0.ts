import { type CodeBlock } from '../../../component'
import { slotDocPage } from '../../../markdown'
import { type RenderHeadingLink, demoContainer } from '../../../prose'
import * as VirtualList from '../../ui/demo/virtualList'
import { RegisteredUiDefinition } from '../../ui/update'
import raw from './foldkit-0-167-0.md'

const { view: renderPost } = slotDocPage<'chat'>(raw, 'foldkit-0-167-0')

type ViewInputs = Readonly<{
  renderCopyButton: CodeBlock.RenderCopyButton
  renderSnippet: CodeBlock.RenderSnippet
  renderHeadingLink: RenderHeadingLink
}>

export const view = RegisteredUiDefinition.view.withInputs<ViewInputs>(
  (model, { renderCopyButton, renderSnippet, renderHeadingLink }, h) =>
    renderPost({
      demos: {
        chat: demoContainer(
          ...VirtualList.virtualListChatDemo(
            model.virtualListChatDemo,
            model.virtualListChatMessages,
            h,
          ),
        ),
      },
      renderCopyButton,
      renderSnippet,
      renderHeadingLink,
    }),
)
