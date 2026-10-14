// Pseudocode walkthrough of the Foldkit integration points. Each labeled
// block below is an excerpt. Fit them into your own Model, init, Message,
// update, and view definitions.
import { Option, Schema } from 'effect'
import { Block, Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { RadioGroup } from '@foldkit/ui'
import type { RenderInfo as RadioGroupRenderInfo } from '@foldkit/ui/radioGroup'

const Plan = Schema.Literals(['Startup', 'Business', 'Enterprise'])
type Plan = typeof Plan.Type

const PlanRadioGroup = RadioGroup.create<Plan>()

// Add fields to your Model for the RadioGroup Block and the selected
// value. The Block keeps private keyboard-focus state; the parent owns
// the selection and passes it back in as selectedValue.
const Model = Schema.Struct({
  planRadioGroup: PlanRadioGroup.Model,
  maybePlan: Schema.Option(Plan),
  // ...your other fields
})
type Model = typeof Model.Type

// In your init function, initialize the RadioGroup Block with a unique
// id and start with nothing selected:
const init = () => {
  const radioGroupInit = planRadioGroup.init({ id: 'plan' })

  return {
    model: {
      planRadioGroup: radioGroupInit.model,
      maybePlan: Option.none(),
      // ...your other fields
    },
    commands: radioGroupInit.commands,
  }
}

// Embed the RadioGroup Message in your parent Message:
const Message = defineMessageUnion({
  GotPlanRadioGroupMessage: { message: PlanRadioGroup.Message },
})
type Message = typeof Message.Type // ...united with your others

const plans: ReadonlyArray<Plan> = ['Startup', 'Business', 'Enterprise']

const descriptions: Record<Plan, string> = {
  Startup: '12GB / 6 CPUs. Perfect for small projects',
  Business: '16GB / 8 CPUs. For growing teams',
  Enterprise: '32GB / 12 CPUs. Dedicated infrastructure',
}

// At module scope, fold the OutMessage into your own Model. The `Selected`
// arm carries the chosen value (typed as `Plan`) and its index, and returns
// an Update.Step. This arm is also where the parent updates its own state or
// dispatches Commands, for example to persist the choice or price the order.
const foldPlanRadioGroupOutMessage = PlanRadioGroup.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { maybePlan: () => Option.some(value) }),
    }),
})

// The connection wires the completed child Block into the parent: it runs the child update,
// writes the child Model back, maps the child's Commands into your Message
// type, and hands any OutMessage to the OutMessage fold.
const planRadioGroup = PlanRadioGroup.connection({
  Model,
  field: 'planRadioGroup',
  parentMessage: Message.GotPlanRadioGroupMessage,
  outMessage: { fold: foldPlanRadioGroupOutMessage },
})

const PlanPickerDefinition = Block.define('PlanPicker', {
  Model,
  Message,
})
const RegisteredPlanPickerDefinition = PlanPickerDefinition.register({
  children: [planRadioGroup],
})

// In the corresponding Message.match handler, call the fold:
const update = PlanPickerDefinition.update((model, message) =>
  Message.match(message, {
    GotPlanRadioGroupMessage: ({ message }) =>
      planRadioGroup.fold(model, message),
  }),
)

// Inside your view function, embed the radio group via h.block and pass
// the parent-owned selection as selectedValue:
const view = RegisteredPlanPickerDefinition.view((model, h) => {
  const radioGroupView = ({ group, options }: RadioGroupRenderInfo<Plan>) =>
    h.div(
      [...group, h.Class('flex flex-col gap-3')],
      options.map(option => {
        const plan = option.value
        return h.div(
          [
            ...option.option,
            h.Class(
              'rounded-lg border p-4 cursor-pointer data-[checked]:border-blue-600',
            ),
          ],
          [
            h.span([...option.label, h.Class('text-sm font-medium')], [plan]),
            h.p(
              [...option.description, h.Class('text-sm text-gray-500')],
              [descriptions[plan]],
            ),
          ],
        )
      }),
    )

  return h.block(
    planRadioGroup.embedView({
      slotId: model.planRadioGroup.id,
      model: model.planRadioGroup,
      viewInputs: {
        options: plans,
        selectedValue: model.maybePlan,
        ariaLabel: 'Server plan',
        hasOptionDescription: () => true,
        toView: radioGroupView,
      },
    }),
  )
})
