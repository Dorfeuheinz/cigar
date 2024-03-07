import { Tabs } from "flowbite-react";
import { HiAdjustments, HiClipboardList } from "react-icons/hi";

import Header from "./components/Header";
import ConfigAndCommunicationTab from "./components/ConfigAndCommunicationTab";
import AppTabs from "./components/AppTabs";
import TerminalPanel from "./components/TerminalPanel";
import { useState, createContext, useEffect } from "react";
import { getConnectedDevice } from "./utils/connection_util";

export const ConnectionContext = createContext({
  isConnected: false,
  setIsConnected: (_: boolean) => {},
});

function App() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    getConnectedDevice().then((result) => {
      if (result) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    });
  });

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <ConnectionContext.Provider
          value={{ isConnected: isConnected, setIsConnected: setIsConnected }}
        >
          <Header />
          <div className="flex-1 overflow-y-scroll">
            <AppTabs aria-label="Tabs with underline" style="underline">
              <Tabs.Item
                title="Configuration and Communication"
                icon={HiAdjustments}
              >
                <ConfigAndCommunicationTab />
              </Tabs.Item>
              <Tabs.Item title="Calibration" icon={HiClipboardList}>
                This is{" "}
                <span className="font-medium text-gray-800 dark:text-white">
                  Contacts tab's associated content
                </span>
                . Clicking another tab will toggle the visibility of this one
                for the next. The tab JavaScript swaps classes to control the
                content visibility and styling.
              </Tabs.Item>
              <Tabs.Item title="Device Information" icon={HiClipboardList}>
                Disabled content
              </Tabs.Item>
            </AppTabs>
          </div>
          <div
            className="flex-1 w-full border-t overflow-y-scroll"
            style={{ minHeight: "30vh", maxHeight: "30vh" }}
          >
            <TerminalPanel />
          </div>
          <footer className="w-full p-1 bg-gray-500">
            <div id="connectionStatus" className="text-center text-white">
              <span id="connectionStatusIcon">{isConnected ? "🟢" : "🔴"}</span>
              <b>Connection Status:</b> &nbsp;
              <span id="connectionStatusText">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </footer>
        </ConnectionContext.Provider>
      </div>
    </>
  );
}

export default App;
