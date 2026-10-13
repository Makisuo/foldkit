import { Array, Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'

// MODEL

const Filter = Schema.Literals(['All', 'Active', 'Done'])

export const Model = Schema.Struct({
  todos: Schema.Array(Todo),
  filter: Filter,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  AddedTodo: {},
  ClearedDoneTodos: {},
  SelectedFilter: { filter: Filter },
})
type Message = typeof Message.Type

const Application = defineApplication({ Model, Message })

// UPDATE

export const update = Application.update((model, message) =>
  Message.match(message, {
    AddedTodo: () => ({
      model: modifyFields(model, { todos: Array.append(emptyTodo()) }),
    }),
    ClearedDoneTodos: () => ({
      model: modifyFields(model, { todos: Array.filter(todo => !todo.done) }),
    }),
    SelectedFilter: ({ filter }) => ({
      model: modifyFields(model, { filter: () => filter }),
    }),
  }),
)
