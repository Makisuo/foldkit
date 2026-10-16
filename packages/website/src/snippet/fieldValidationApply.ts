import { validate } from 'foldkit/fieldValidation'
import { modifyFields } from 'foldkit/struct'

const validateUsername = validate(usernameRules)

const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ChangedUsername: ({ value }) => ({
      model: modifyFields(model, {
        username: () => validateUsername(value),
      }),
    }),
  }),
)
