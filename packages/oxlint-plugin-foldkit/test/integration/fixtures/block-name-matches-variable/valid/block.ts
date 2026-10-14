import { ImportedDefinition } from './definition'
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
const RegisteredComposition = Block.define('Registered', {
  Model,
  Message,
}).toComposition({})
const IdentityFirstDefinition = Block.define('IdentityFirst').define({
  Model,
  Message,
})
const IdentityFirstComposition = Block.define(
  'IdentityFirst',
).define({ Model, Message }).toComposition({})
const ApplicationDefinition = defineApplication({ Model, Message })
const ApplicationComposition = defineApplication({ Model, Message }).toComposition({})
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
void RegisteredComposition
void IdentityFirstDefinition
void IdentityFirstComposition
void ApplicationDefinition
void ApplicationComposition
void DynamicBlock
void ImportedAlias
void Unrelated
void useShadowedBlock

const SeparateDefinition = Block.define('Separate', { Model, Message })
const SeparateComposition = SeparateDefinition.toComposition()
const ImportedComposition = ImportedDefinition.toComposition()
void SeparateComposition
void ImportedComposition
