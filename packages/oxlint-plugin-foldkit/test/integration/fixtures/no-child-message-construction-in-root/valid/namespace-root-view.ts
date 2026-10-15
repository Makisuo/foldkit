import * as StateMachine from './stateMachine'

type StateMachineHtmlBuilder = Parameters<
  Parameters<typeof StateMachine.ApplicationComposition.view>[0]
>[1]

const continueButton = (h: StateMachineHtmlBuilder) =>
  h.button([h.OnClick(StateMachine.Message.ClickedContinue())])

export const view = StateMachine.ApplicationComposition.view((_model, h) =>
  continueButton(h),
)
