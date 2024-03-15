import { useState, useContext } from "react";
import DeviceSelect from "./DeviceSelect";
import InputWithDatalist from "./InputWithDatalist";
import {
  connectToDevice,
  disconnectFromDevice,
} from "../utils/connection_util";

import ConnectDisconnectButton from "./ConnectDisconnectButton";
import ConfigModeToggle from "./ConfigModeToggle";
import { ConnectionContext } from "../App";
import { invoke } from "@tauri-apps/api";
import { message } from "@tauri-apps/api/dialog";

function Header() {
  const [baudRate, setBaudRate] = useState<number>(19200);
  const [deviceName, setDeviceName] = useState("");
  const { currentMode, setCurrentMode } = useContext(ConnectionContext);

  return (
    <header className="w-screen bg-blue-500 py-[1vh] px-[2vw] text-white h-[7vh] ">
      <div className="space-x-4 flex flex-row ">
        <div className="">
          <InputWithDatalist
            optionsProvider={() => ["19200", "115200"]}
            onValueChanged={(value) => {
              let parsedValue = parseInt(value);
              setBaudRate(parsedValue);
            }}
            className="rounded-md border-gray-300 text-black h-[5vh]"
            placeholder="Baud Rate"
          />
        </div>
        <div className="">
          <DeviceSelect
            className="rounded-md border-gray-300 h-[5vh] text-black"
            onSelected={setDeviceName}
          />
        </div>
        <div className="">
          <ConnectDisconnectButton
            connectFunction={async () => {
              try {
                await connectToDevice(deviceName, baudRate);
                await invoke("send_bytes", { input: "X" });
                setCurrentMode("communication");
                await invoke("start_communication_task", {});
                return true;
              } catch (error) {
                await message(
                  `Encountered an error while trying to connect: ${error}`,
                  {
                    title: "Tinymesh CC Tool",
                    type: "error",
                  }
                );
                return false;
              }
            }}
            disconnectFunction={async () => {
              await invoke("stop_communication_task", {});
              await invoke("send_bytes", { input: "X" });
              setCurrentMode("communication");
              return await disconnectFromDevice();
            }}
            className="h-[5vh] inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          />
        </div>
        <div className="">
          <ConfigModeToggle retries={10} interval={1} />
        </div>
      </div>
    </header>
  );
}

export default Header;
