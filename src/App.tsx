import { Tabs } from "flowbite-react";
import { HiAdjustments, HiClipboardList } from "react-icons/hi";

import Header from "./components/Header";
import ConfigAndCommunicationTab from "./components/ConfigAndCommunicationTab";
import AppTabs from "./components/AppTabs";
import TerminalPanel from "./components/TerminalPanel";

import { useState, createContext, useEffect } from "react";
import { getConnectedDevice } from "./utils/connection_util";
import DeviceInfo from "./components/DeviceInfo";
// import { readBinaryFile, BaseDirectory } from "@tauri-apps/api/fs";
import Calibration from "./components/Calibration";

// async function convertImageToBase64(): Promise<string> {
//   const contents = await readBinaryFile("resources/icons/tinymesh-white.png", {
//     dir: BaseDirectory.Resource,
//   });
//   return btoa(String.fromCharCode(...new Uint8Array(contents)));
// }

export const ConnectionContext = createContext({
  isConnected: false,
  setIsConnected: (_: boolean) => {},
  currentMode: "communication",
  setCurrentMode: (_: string) => {},
  model: "",
  setModel: (_: string) => {},
  firmware: "",
  setFirmware: (_: string) => {},
  hardware: "",
  setHardware: (_: string) => {},
});

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentMode, setCurrentMode] = useState("communication");
  const [model, setModel] = useState("");
  const [firmware, setFirmware] = useState("");
  const [hardware, setHardware] = useState("");
  // const [_logoContent, setLogoContent] = useState("");

  useEffect(() => {
    getConnectedDevice().then((result) => {
      if (result) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    });
    // convertImageToBase64().then((result) => {
    //   setLogoContent(result);
    //   console.log(result);
    // });
  });

  return (
    <>
      <div className="flex flex-col overflow-hidden max-h-screen h-screen fixed top-0">
        <ConnectionContext.Provider
          value={{
            isConnected: isConnected,
            setIsConnected: setIsConnected,
            currentMode: currentMode,
            setCurrentMode: setCurrentMode,
            model: model,
            setModel: setModel,
            hardware: hardware,
            setHardware: setHardware,
            firmware: firmware,
            setFirmware: setFirmware,
          }}
        >
          <div className="h-[7vh] max-h-[7vh] overflow-hidden">
            <Header />
          </div>
          <div className="flex-1 h-[63vh] max-h-[63vh] border-none">
            <AppTabs aria-label="Tabs with underline" style="underline">
              <Tabs.Item title="Configuration" icon={HiAdjustments}>
                <ConfigAndCommunicationTab />
              </Tabs.Item>
              <Tabs.Item
                title="Calibration"
                icon={HiAdjustments}
                disabled={currentMode !== "configuration"}
              >
                <div className="h-[55vh] max-h-[55vh] px-[5vw] mt-[-5px] border-none">
                  <Calibration></Calibration>
                </div>
              </Tabs.Item>
              <Tabs.Item
                title="Device Info"
                icon={HiClipboardList}
                disabled={currentMode !== "configuration"}
              >
                <DeviceInfo />
              </Tabs.Item>
            </AppTabs>
          </div>
          <div className="flex-1 w-full border-t h-[25vh] max-h-[25vh] ">
            <TerminalPanel size={300} />
          </div>
          <footer className="w-full p-1 bg-gray-500 h-[5vh] max-h-[5vh] fixed bottom-0">
            <div id="connectionStatus" className="text-center text-white">
              <span className="float-start">
                <img
                  src={`data:image/png;base64,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`}
                  width="100"
                  height="28"
                ></img>
              </span>
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
