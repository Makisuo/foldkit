import {
  make as makeApplication,
  makeElement as makeApplicationElement,
} from './application.js'
import { makeDefine } from './applicationAuthoring.js'

export type { Application, Element } from './application.js'
export type {
  Composition,
  Definition,
  HtmlBuilderOf,
} from './applicationAuthoring.js'

/** Defines a root Application authoring namespace. */
export const define = makeDefine({
  make: makeApplication,
  makeElement: makeApplicationElement,
})
