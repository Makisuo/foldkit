import { Block, Block as AliasedBlock } from 'foldkit'
import * as Foldkit from 'foldkit'
import { define as aliasedDefine, define } from 'foldkit/block'
import * as BlockModule from 'foldkit/block'

import { block as ImportedFeature } from './feature.ts'

const blockName = 'DynamicBlock'

const Root = Block.define('Root')
const AliasedRoot = AliasedBlock.define('AliasedRoot')
const NamespaceRoot = Foldkit.Block.define('NamespaceRoot')
const SubpathDefine = define('SubpathDefine')
const AliasedSubpathDefine = aliasedDefine('AliasedSubpathDefine')
const SubpathNamespace = BlockModule.define('SubpathNamespace')
const Registered = Block.define('Registered', {
  Model,
  Message,
}).register({})
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

void Root
void AliasedRoot
void NamespaceRoot
void SubpathDefine
void AliasedSubpathDefine
void SubpathNamespace
void Registered
void DynamicBlock
void ImportedAlias
void Unrelated
void useShadowedBlock
