import React, { useState, useContext, useEffect } from "react";
import { ConnectionContext } from "../App";
import { getConnectedDevice } from "../utils/connection_util";
import { error } from "tauri-plugin-log-api";

type ConnectDisconnectButtonProps = {
  connectFunction: () => Promise<boolean>;
  disconnectFunction: () => Promise<boolean>;
  className: string;
};

const ConnectDisconnectButton: React.FC<ConnectDisconnectButtonProps> = ({
  connectFunction,
  disconnectFunction,
  className,
}) => {
  const { isConnected, setIsConnected} = useContext(ConnectionContext);
  const [buttonText, setButtonText] = useState(
    isConnected ? "Disconnect" : "Connect"
  );

  useEffect(() => {
    getConnectedDevice().then((result) => {
      if (result) {
        setIsConnected(true);
        setButtonText("Disconnect");
      } else {
        setIsConnected(false);
        setButtonText("Connect");
      }
    });
  });

  const handleButtonClick = async () => {
    try {
      if (buttonText === "Connect") {
        const result1 = await connectFunction();
        if (result1) {
          setButtonText("Disconnect");
        }
      } else {
        const result2 = await disconnectFunction();
        if (result2) {
          setButtonText("Connect");
        }
      }
    } catch (err) {
      error(`Error occurred: ${err}`);
    }
  };

  return (
    <button type="button" onClick={handleButtonClick} className={className}>
      <div id="connectDisconnectBtnText">{buttonText}</div>&nbsp;
      <svg
        className="ms-2 h-3.5 w-3.5 rtl:rotate-180"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 14 10"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M1 5h12m0 0L9 1m4 4L9 9"
        />
      </svg>
    </button>
  );
};

export default ConnectDisconnectButton;
