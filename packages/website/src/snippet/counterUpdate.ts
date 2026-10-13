import { modifyFields } from 'foldkit/struct'

// UPDATE

const update = definition.update((model, message) =>
  Message.match(message, {
    ClickedDecrement: () => ({
      model: modifyFields(model, { count: count => count - 1 }),
    }),
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: count => count + 1 }),
    }),
    ClickedReset: () => ({ model: modifyFields(model, { count: () => 0 }) }),
  }),
)
