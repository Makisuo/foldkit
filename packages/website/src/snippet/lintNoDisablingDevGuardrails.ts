import { ApplicationComposition, init, update, view } from './application'

// ❌ Bad
// Turning off freezeModel silences the dev warning instead of fixing the
// mutation it caught.
const badApplication = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  freezeModel: false,
})

// ✅ Good
// Leave the guardrail on and fix the in-place mutation it flags.
const goodApplication = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
})
