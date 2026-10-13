import { Child as WorkspaceChild } from '@app/child'
import { Message as FeatureMessage } from 'feature/message'
import { Block } from 'foldkit'
import { CommandPalette } from '@foldkit/ui'

import { Child, Message as ChildMessage } from './child'
import { Message as NestedMainMessage } from './child/main'
import { Message as ServerChildMessage } from './child.server'
import { Message } from './directChild'
import * as Features from './features'
import { GotChildMessage, Message as ParentMessage } from './message'
import { Model } from './model'
import { parentViewDefinition } from './parent'
import { picker } from './picker'
import { Message as SearchMessage } from '../search'

// UPDATE

export const update = (model: Model) => {
  const command = GotChildMessage({
    message: Child.Message.ClickedBarrelSave(),
  })
  const directCommand = GotChildMessage({
    message: ChildMessage.ClickedDirectBarrelSave(),
  })
  const unaliasedCommand = GotChildMessage({
    message: Message.ClickedDirectChildSave(),
  })
  const nestedCommand = GotChildMessage({
    message: Features.Account.Profile.Message.ClickedProfileSave(),
  })
  const nestedMainCommand = GotChildMessage({
    message: NestedMainMessage.ClickedNestedSave(),
  })
  const workspaceCommand = GotChildMessage({
    message: WorkspaceChild.Message.ClickedWorkspaceSave(),
  })
  const featureCommand = GotChildMessage({
    message: FeatureMessage.ClickedFeatureSave(),
  })
  const searchCommand = GotChildMessage({
    message: SearchMessage.ClickedSearchResult(),
  })
  const uiCommand = GotChildMessage({
    message: CommandPalette.Message.OpenedCommandPalette(),
  })
  const genericCommand = GotChildMessage({
    message: picker.Message.SelectedValue(),
  })
  return {
    model,
    commands: [
      command,
      directCommand,
      unaliasedCommand,
      nestedCommand,
      nestedMainCommand,
      workspaceCommand,
      featureCommand,
      searchCommand,
      uiCommand,
      genericCommand,
    ],
  }
}

const ParentView = Block.define('ParentView')
const parentView = ParentView.define({
  Model,
  Message: ParentMessage,
})
export const view = parentView.view((_model, h) =>
  h.button([h.OnClick(Child.Message.ClickedParentViewSave())]),
)

export const importedParentView = parentViewDefinition.view((_model, h) =>
  h.button([h.OnClick(Child.Message.ClickedImportedParentViewSave())]),
)

export const parentStep = parentView.step(model => ({
  model,
  message: Child.Message.ClickedParentStepSave(),
}))

const ServerChildView = Block.define('ServerChildView')
const serverChildViewDefinition = ServerChildView.define({
  Model: Child.Model,
  Message: Child.Message,
})
export const serverChildView = serverChildViewDefinition.view((_model, h) =>
    h.button([h.OnClick(ServerChildMessage.ClickedServerChildSave())]),
  )
