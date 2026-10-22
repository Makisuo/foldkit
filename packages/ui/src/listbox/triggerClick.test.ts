import { Option, Schema } from 'effect'
import { Block, Program, Runtime } from 'foldkit'
import { afterEach, expect, vi } from 'vitest'

import { describe, it } from '@effect/vitest'

import { create } from './public.js'

const TestListbox = create<string>()

const Model = Schema.Struct({ listbox: TestListbox.Model })
const ApplicationDefinition = Block.makeDefinition('ListboxTriggerClickTest', {
  Model,
  Message: Schema.Never,
})
const foldListboxOutMessage = ApplicationDefinition.makeOutMessageFold(
  TestListbox,
  {
    Selected: () => ApplicationDefinition.makeNoopStep(),
  },
)
const ListboxBinding = ApplicationDefinition.makeBinding(TestListbox, {
  field: 'listbox',
  init: false,
}).withOutMessagePolicy({ fold: foldListboxOutMessage })
const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [ListboxBinding],
})
const view = ApplicationComposition.makeView((model, h) =>
  h.div(
    [],
    [
      h.block(
        ListboxBinding.embedView({
          slotId: 'listbox',
          model: model.listbox,
          viewInputs: {
            items: ['Name'],
            itemToConfig: item => ({ content: h.span([], [item]) }),
            buttonContent: h.span([], ['Sort']),
            maybeSelectedValue: Option.none(),
            anchor: { placement: 'bottom-start' },
          },
        }),
      ),
    ],
  ),
)
const ApplicationBlock = ApplicationComposition.assembleBlock({
  init: ApplicationComposition.makeInit(() =>
    ListboxBinding.init({
      args: [{ id: 'sort', isModal: true }],
      toParentModel: listbox => ({ listbox }),
    }),
  ),
  update: ApplicationComposition.makeUpdate(),
  view,
})

const requireElement = (id: string): HTMLElement => {
  const element = document.getElementById(id)
  if (element === null) {
    throw new Error(`Missing #${id}`)
  }
  return element
}

const clickButtonInOneTask = (button: HTMLElement) => {
  button.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      pointerType: 'mouse',
      button: 0,
    }),
  )
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
}

describe('Listbox trigger click', () => {
  afterEach(() => {
    document.body.replaceChildren()
    document.documentElement.style.overflow = ''
  })

  it('treats a same-task click as one open', async () => {
    const background = document.createElement('button')
    const container = document.createElement('div')
    container.id = 'app'
    document.body.append(background, container)
    const handle = Runtime.embed(
      Program.makeElement({ block: ApplicationBlock, container }),
    )

    try {
      await vi.waitFor(() => {
        expect(document.getElementById('sort-button')).not.toBeNull()
      })

      clickButtonInOneTask(requireElement('sort-button'))

      await vi.waitFor(() => {
        expect(
          document.getElementById('sort-button')?.getAttribute('aria-expanded'),
        ).toBe('true')
        expect(document.documentElement.style.overflow).toBe('hidden')
        expect(background.inert).toBe(true)
      })
    } finally {
      handle.dispose()
    }
  })
})
