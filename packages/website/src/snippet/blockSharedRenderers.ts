const renderCopyButton = SnippetCopy.renderer(model.snippetCopy, config =>
  h.block(snippetCopy.embedView(config)),
)

h.block(
  comingFromReact.embedView({
    slotId: 'coming-from-react',
    model: model.comingFromReact,
    viewInputs: {
      renderCopyButton,
      renderSnippet: SnippetDisclosure.renderer(
        model.snippetDisclosure,
        renderCopyButton,
        config => h.block(snippetDisclosure.embedView(config)),
      ),
      renderHeadingLink: Prose.renderHeadingLink(
        hash => Message.ClickedCopyLink({ hash }),
        h,
      ),
    },
  }),
)
