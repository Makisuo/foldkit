const foldLoginOutMessage = Application.makeOutMessageFold(Login.LoginBlock, {
  RequestedMagicLink: ({ email }, { liftCommand }) =>
    Application.step(model => ({
      model,
      commands: [
        liftCommand(Login.SendMagicLink({ email, redirectRoute: model.route })),
      ],
    })),
})
