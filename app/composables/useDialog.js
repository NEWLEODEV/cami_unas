export const useDialog = () => {
  const dialogState = useState('dialogState', () => ({
    isOpen: false,
    type: 'alert', // 'alert' ou 'confirm'
    title: '',
    message: '',
    resolvePromise: null
  }))

  const showAlert = (message, title = 'Aviso') => {
    return new Promise((resolve) => {
      dialogState.value = {
        isOpen: true,
        type: 'alert',
        title,
        message,
        resolvePromise: resolve
      }
    })
  }

  const showConfirm = (message, title = 'Confirmação') => {
    return new Promise((resolve) => {
      dialogState.value = {
        isOpen: true,
        type: 'confirm',
        title,
        message,
        resolvePromise: resolve
      }
    })
  }

  const closeDialog = (result = false) => {
    if (dialogState.value.resolvePromise) {
      dialogState.value.resolvePromise(result)
    }
    dialogState.value.isOpen = false
    setTimeout(() => {
      dialogState.value.resolvePromise = null
    }, 300)
  }

  return {
    dialogState,
    showAlert,
    showConfirm,
    closeDialog
  }
}
