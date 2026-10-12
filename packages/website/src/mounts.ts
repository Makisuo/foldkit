import { Dialog, Menu } from '@foldkit/ui'

import { Example, Playground, Ui } from './page'
import * as Search from './search'
import * as SnippetDisclosure from './snippetDisclosure'

export const mounts = [
  ...Dialog.mounts,
  ...Menu.mounts,
  ...Ui.mounts,
  ...Search.mounts,
  ...Playground.mounts,
  ...Example.mounts,
  ...SnippetDisclosure.mounts,
]
