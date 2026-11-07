import type { Document } from '../html/index.js'

/**
 * Where a runtime renders when it does not own a DOM container: a native
 * renderer, a canvas, a test harness. The runtime keeps everything else
 * (update, Commands, Subscriptions, ManagedResources, Ports, routing) and
 * hands the target each rendered Document instead of patching the DOM.
 *
 * The VNodes in `body` keep their `data.on` handlers, so the target routes
 * input by calling them with an event-shaped object. Mounts are not acquired:
 * their markers stay on `data.foldkitMount` for the target to read.
 */
export type RenderTarget = Readonly<{
  /** Receives every committed Document, the crash view included. */
  commit: (document: Document) => void
  /** Schedules the next render frame. A browser target would use
   *  `requestAnimationFrame`; a native target, its own frame clock. */
  requestFrame: (frame: () => void) => void
  /** Called once when the runtime is disposed. */
  release: () => void
  /** Identifies the runtime, as a container's `id` does: Model preservation
   *  across development reloads keys on it. */
  id: string
}>

/** What a runtime renders into: a DOM container, or a {@link RenderTarget}. */
export type RenderSurface =
  | Readonly<{ _tag: 'Container'; container: HTMLElement }>
  | Readonly<{ _tag: 'Target'; target: RenderTarget }>

/** The render surface half of `makeApplication` and `makeElement` config:
 *  exactly one of a DOM `container` or a `renderTarget`. */
export type RenderSurfaceConfig =
  | Readonly<{ container: HTMLElement | null; renderTarget?: never }>
  | Readonly<{ renderTarget: RenderTarget; container?: never }>
