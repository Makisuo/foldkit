// ✅ Preserve connected Steps until the Composition runs them.
import { Update } from 'foldkit'

import {
  ApplicationDefinition,
  DialogBinding,
  SelectionBinding,
} from './composition'

export const finishEditing = ApplicationDefinition.step(() =>
  Update.combine([
    DialogBinding.requestClose(),
    SelectionBinding.requestClear(),
  ]),
)
