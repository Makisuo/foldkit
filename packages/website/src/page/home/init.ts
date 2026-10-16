import { HomeComposition } from './composition'

export const init = HomeComposition.init(() => ({
  model: {
    activeDemoTab: 'Architecture',
  },
}))
