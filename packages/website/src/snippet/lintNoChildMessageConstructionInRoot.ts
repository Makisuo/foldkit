import * as Child from './child'

// ❌ Bad
// The root reaches into the child Message namespace to build a child Message.
const badRouting = () =>
  GotChildMessage({ message: Child.Message.ClickedSave() })

const clickedSave = Child.Message.ClickedSave
const badAliasRouting = () => GotChildMessage({ message: clickedSave() })

// ✅ Good
// The parent invokes the public Step projected by its registered binding.
const goodRouting = (model: Model) => child.save()(model)
