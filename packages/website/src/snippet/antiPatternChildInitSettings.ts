// settings.ts

export const Theme = Schema.Literals(['Light', 'Dark'])
export type Theme = typeof Theme.Type

export const Message = defineMessageUnion({
  RestoredTheme: { theme: Theme },
  CompletedRefreshAvailableThemes: {},
})

export const OutMessage = defineMessageUnion({
  RestoredTheme: { theme: Theme },
})

export const init = () => ({ model: Model.make({ theme: 'Light' }) })

export const update = Settings.update((model, message) =>
  Message.match(message, {
    RestoredTheme: ({ theme }) => ({
      model: modifyFields(model, { theme: () => theme }),
      commands: [RefreshAvailableThemes()],
      outMessage: OutMessage.RestoredTheme({ theme }),
    }),
    CompletedRefreshAvailableThemes: () => ({ model }),
  }),
)

export const restore = Settings.step((model, theme: Theme) =>
  update(model, Message.RestoredTheme({ theme })),
)

export const block = Settings.toComposition().toBlock({
  init,
  update,
  expose: { restore },
  EffectsLayer,
})
