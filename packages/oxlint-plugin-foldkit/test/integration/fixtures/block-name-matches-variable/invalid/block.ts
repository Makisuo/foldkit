import { ImportedDefinition as EarlierDefinition } from '../valid/definition'
import { Block, Block as AliasedBlock } from 'foldkit'
import * as Foldkit from 'foldkit'
import { define as aliasedDefine, define } from 'foldkit/block'
import * as BlockModule from 'foldkit/block'
import { define as defineApplication } from 'foldkit/application'

const WrongRoot = Block.define('Root')
const WrongAliasedRoot = AliasedBlock.define('AliasedRoot')
const WrongNamespaceRoot = Foldkit.Block.define('NamespaceRoot')
const WrongSubpathDefine = define('SubpathDefine')
const WrongAliasedSubpathDefine = aliasedDefine('AliasedSubpathDefine')
const WrongRegistered = BlockModule.define('Registered', {
  Model,
  Message,
}).toComposition({})
const WrongIdentityFirst = Block.define('IdentityFirst').define({
  Model,
  Message,
})
const WrongApplication = defineApplication({ Model, Message })
const WrongRegisteredApplication = defineApplication({
  Model,
  Message,
}).toComposition({})

void WrongRoot
void WrongAliasedRoot
void WrongNamespaceRoot
void WrongSubpathDefine
void WrongAliasedSubpathDefine
void WrongRegistered
void WrongIdentityFirst
void WrongApplication
void WrongRegisteredApplication

const SeparateDefinition = Block.define('Separate', { Model, Message })
const WrongSeparateComposition = SeparateDefinition.toComposition()
const WrongImportedComposition = EarlierDefinition.toComposition()
void WrongSeparateComposition
void WrongImportedComposition
