const dialogInit = dialog.init({ id: 'confirm' })

return Update.combine({ dialog: dialogInit.model }, [dialog.open()])
