import { Application, init, update, view } from './application'

// ❌ Bad
// Turning off freezeModel silences the dev warning instead of fixing the
// mutation it caught.
const badApplication = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
  freezeModel: false,
})

// ✅ Good
// Leave the guardrail on and fix the in-place mutation it flags.
const goodApplication = Application.make({
  init,
  update,
  view,
  container: document.getElementById('root'),
})
