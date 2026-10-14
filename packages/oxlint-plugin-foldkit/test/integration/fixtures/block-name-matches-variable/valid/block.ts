import { Block, Block as AliasedBlock } from 'foldkit'
import * as Foldkit from 'foldkit'
import { define as aliasedDefine, define } from 'foldkit/block'
import * as BlockModule from 'foldkit/block'
import { define as defineApplication } from 'foldkit/application'

import { block as ImportedFeature } from './feature.ts'

const blockName = 'DynamicBlock'

const RootDefinition = Block.define('Root')
const AliasedRootDefinition = AliasedBlock.define('AliasedRoot')
const NamespaceRootDefinition = Foldkit.Block.define('NamespaceRoot')
const SubpathDefineDefinition = define('SubpathDefine')
const AliasedSubpathDefineDefinition = aliasedDefine('AliasedSubpathDefine')
const SubpathNamespaceDefinition = BlockModule.define('SubpathNamespace')
const RegisteredDefinition = Block.define('Registered', {
  Model,
  Message,
}).register({})
const IdentityFirstDefinition = Block.define('IdentityFirst').define({
  Model,
  Message,
})
const RegisteredIdentityFirstDefinition = Block.define(
  'IdentityFirst',
).define({ Model, Message }).register({})
const ApplicationDefinition = defineApplication({ Model, Message })
const Application = defineApplication({ Model, Message }).register({})
const DynamicBlock = AliasedBlock.define(blockName)
const ImportedAlias = ImportedFeature

const registry = {
  define: (name: string) => name,
}
const Unrelated = registry.define('DifferentName')

const useShadowedBlock = (Block: typeof AliasedBlock) => {
  const LocalBlock = Block.define('DifferentName')

  return LocalBlock
}

void RootDefinition
void AliasedRootDefinition
void NamespaceRootDefinition
void SubpathDefineDefinition
void AliasedSubpathDefineDefinition
void SubpathNamespaceDefinition
void RegisteredDefinition
void IdentityFirstDefinition
void RegisteredIdentityFirstDefinition
void ApplicationDefinition
void Application
void DynamicBlock
void ImportedAlias
void Unrelated
void useShadowedBlock
