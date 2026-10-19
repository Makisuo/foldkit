import type { Application, Element } from 'foldkit/application'

import { application, element } from './assembly-view.accepted.js'

const passiveApplication: Application<undefined, void, never, never, never> =
  application
const passiveElement: Element<undefined, never, never, never> = element
void passiveApplication
void passiveElement
