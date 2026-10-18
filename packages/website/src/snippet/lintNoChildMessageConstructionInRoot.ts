import * as Child from './child'
import { ApplicationDefinition } from './definition'

// ❌ Bad
// The root reaches into the child Message namespace to build a child Message.
const badRouting = () =>
  GotChildMessage({ message: Child.Message.ClickedSave() })

const clickedSave = Child.Message.ClickedSave
const badAliasRouting = () => GotChildMessage({ message: clickedSave() })

// ✅ Good
// The parent invokes the operation projected by its child Binding.
const goodRouting = ApplicationDefinition.step(() => ChildBinding.requestSave())
