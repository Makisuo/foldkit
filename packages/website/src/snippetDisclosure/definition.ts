import { SnippetDisclosure } from './block'
import { MeasureSnippetHeight } from './mount'

export const snippetDisclosure = SnippetDisclosure.register({
  mounts: [MeasureSnippetHeight],
})
