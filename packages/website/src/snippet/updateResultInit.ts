import { Application } from './definition'

const init = Application.init(() => {
  const homeInit = home.init()

  return {
    model: { home: homeInit.model },
    commands: homeInit.commands,
  }
})
