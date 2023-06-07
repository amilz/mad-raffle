import useNotificationStore from "../stores/useNotificationStore";

export function notify(newNotification: {
  type?: string
  message: string
  description?: string
  txid?: string
}) {
  if (newNotification.message === "WalletSendTransactionError: User rejected the request.") {
    return; 
  }
  if (newNotification.message && newNotification.message.toLowerCase().includes("rejected the request".toLowerCase())) {
    return; 
  }
  if (newNotification.description && newNotification.description.toLowerCase().includes("rejected the request".toLowerCase())) {
    return; 
  }
  if (newNotification.message && newNotification.message.toLowerCase().includes("user denied transaction signature".toLowerCase())) {
    return; 
  }
  if (newNotification.description && newNotification.description.toLowerCase().includes("user denied transaction signature".toLowerCase())) {
    return; 
  }
  
  const {
    notifications,
    set: setNotificationStore,
  } = useNotificationStore.getState()

  setNotificationStore((state: { notifications: any[] }) => {
    state.notifications = [
      ...notifications,
      { type: 'success', ...newNotification },
    ]
  })
}
