import { Tabs } from "flowbite-react";
import { HiAdjustments, HiClipboardList } from "react-icons/hi";

import Header from "./components/Header";
import ConfigAndCommunicationTab from "./components/ConfigAndCommunicationTab";
import AppTabs from "./components/AppTabs";
import TerminalPanel from "./components/TerminalPanel";

import { useState, createContext, useEffect } from "react";
import { getConnectedDevice } from "./utils/connection_util";
import Device_info from "./components/DeviceInfo";

export const ConnectionContext = createContext({
  isConnected: false,
  setIsConnected: (_: boolean) => {},
  currentMode: "communication",
  setCurrentMode: (_: string) => {},
});

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentMode, setCurrentMode] = useState("communication");

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
      <div className="flex flex-col h-screen overflow-hidden md:max-h-screen md:min-h-screen">
        <ConnectionContext.Provider
          value={{
            isConnected: isConnected,
            setIsConnected: setIsConnected,
            currentMode: currentMode,
            setCurrentMode: setCurrentMode,
          }}
        >
          <div style={{ minHeight: "10vh", maxHeight: "10vh" }}>
            <Header />
          </div>
          <div
            className="flex-1 overflow-y-scroll"
            style={{ minHeight: "60vh", maxHeight: "60vh" }}
          >
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
                <Device_info></Device_info>
              </Tabs.Item>
            </AppTabs>
          </div>
          <div
            className="flex-1 w-full border-t overflow-y-scroll relative t-1"
            style={{ minHeight: "25vh", maxHeight: "25vh" }}
          >
            <TerminalPanel size={300} />
          </div>
          <footer
            className="w-full p-1 bg-gray-500"
            style={{ minHeight: "5vh", maxHeight: "5vh" }}
          >
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
