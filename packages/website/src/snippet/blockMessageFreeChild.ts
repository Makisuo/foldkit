import { Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const PreviewModel = Schema.Struct({ content: Schema.String })
const PreviewDefinition = Block.define('Preview', {
  Model: PreviewModel,
  Message: Schema.Never,
})
const PreviewComposition = PreviewDefinition.makeComposition()
const PreviewBlock = PreviewComposition.makeBlock({
  init: PreviewComposition.makeInit(() => ({
    model: PreviewModel.make({ content: '' }),
  })),
  update: PreviewComposition.makeUpdate(),
})

const PageModel = Schema.Struct({ preview: PreviewModel })
const PageMessage = defineMessageUnion({ ClickedPublish: {} })
const PageDefinition = Block.define('Page', {
  Model: PageModel,
  Message: PageMessage,
})

export const PreviewBinding = PageDefinition.bindChild(PreviewBlock, {
  field: 'preview',
})
