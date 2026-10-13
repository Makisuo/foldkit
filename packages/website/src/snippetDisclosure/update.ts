import { HashMap, HashSet } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { snippetDisclosure } from './definition'
import { Message } from './message'

export const update = snippetDisclosure.update((model, message) =>
  Message.match(message, {
    ToggledCodeDisclosure: ({ disclosureId, isOpen }) => ({
      model: modifyFields(model, {
        openDisclosureIds: isOpen
          ? HashSet.add(disclosureId)
          : HashSet.remove(disclosureId),
      }),
    }),
    CompletedMeasureSnippetHeight: ({ snippetId, snippetSize }) => ({
      model: modifyFields(model, {
        snippetSizes: HashMap.set(snippetId, snippetSize),
      }),
    }),
  }),
)
