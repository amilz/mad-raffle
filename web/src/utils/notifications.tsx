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
  if (newNotification.message.toLowerCase().includes("rejected the request".toLowerCase())) {
    return; 
  }
  if (newNotification.description.toLowerCase().includes("rejected the request".toLowerCase())) {
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
