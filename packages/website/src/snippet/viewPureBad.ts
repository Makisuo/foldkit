import { ApplicationComposition } from './application'

// ❌ Don't do this in view
const view = ApplicationComposition.view((model, h) => {
  fetch('/api/user').then(res => res.json())
  setTimeout(() => console.log('tick'), 1000)
  window.addEventListener('resize', () => {})

  return { title: model.title, body: h.div([], [model.title]) }
})
