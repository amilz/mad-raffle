import { useEffect } from 'react'
import { XIcon } from '@heroicons/react/solid'
import useNotificationStore from '../stores/useNotificationStore'
import { useNetworkConfiguration } from 'contexts/NetworkConfigurationProvider';

const NotificationList = () => {
  const { notifications, set: setNotificationStore } = useNotificationStore((s) => s);
  const reversedNotifications = [...notifications].reverse();

  return (
    <div
      className={`z-20 fixed bottom-0 left-0 flex items-end px-2 py-2 pointer-events-none `}
    >
      <div className={`flex flex-col w-full`}>
        {reversedNotifications.map((n, idx) => (
          <Notification
            key={`${n.message}${idx}`}
            type={n.type}
            message={n.message}
            description={n.description}
            txid={n.txid}
            onHide={() => {
              setNotificationStore((state: any) => {
                const reversedIndex = reversedNotifications.length - 1 - idx;
                state.notifications = [
                  ...notifications.slice(0, reversedIndex),
                  ...notifications.slice(reversedIndex + 1),
                ];
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

const Notification = ({ type, message, description, txid, onHide }) => {
  const { networkConfiguration } = useNetworkConfiguration();

  useEffect(() => {
    const id = setTimeout(() => {
      onHide()
    }, 8000);

    return () => {
      clearInterval(id);
    };
  }, [onHide]);

  return (
    <div
    className={` max-w-[calc(100%-1rem)] w-full bg-bkg-1 shadow-lg rounded-md mt-2 pointer-events-auto ring-1 ring-black ring-opacity-5 p-2 ml-2 mr-4 overflow-hidden`}
    >
      <div className={`p-4 rounded-md bg-madlad-red`}>
        <div className={`flex items-center`}>
          <div className={`ml-1   flex-1`}>
            <div className={`text-xl tracking-wide leading-5 text-fgd-1`}>{message}</div>
            {description ? (
              <p className={`text-xl tracking-wide text-fgd-2`}>{description}</p>
            ) : null}
            {txid ? (
              <div className="flex flex-row">
                <a
                  href={'https://explorer.solana.com/tx/' + txid + `?cluster=${networkConfiguration}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-row link link-accent text-emerald-200"
                >
                  <svg className="flex-shrink-0 h-4 ml-2 mt-0.5 text-primary-light w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  <div className="flex mx-4">{txid.slice(0, 8)}...
                    {txid.slice(txid.length - 8)}
                  </div>
                </a>
              </div>
            ) : null}
          </div>
          <div className={`ml-4 flex-shrink-0 self-start flex`}>
            <button
              onClick={() => onHide()}
              className={`bg-bkg-2 default-transition rounded-md inline-flex text-fgd-3 hover:text-fgd-4 focus:outline-none`}
            >
              <span className={`sr-only`}>Close</span>
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


export default NotificationList
