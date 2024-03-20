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
  const {
    isConnected,
    setCurrentMode,
    currentMode,
    model,
    firmware,
    hardware,
  } = useContext(ConnectionContext);

  function buttonsAndDeviceInfo(isConnected: boolean) {
    if (isConnected && currentMode === "configuration") {
      return (
        <div className=" text-sm flex space-x-4 p-[1vh] h-[5vh] lg:text">
          <div>
            <span>
              <b>Model :</b>
            </span>
            <span className="border border-white p-[2px] lg:p-[5px]">
              {model}
            </span>
          </div>
          <div>
            <span>
              <b>F.W. VERSION :</b>
            </span>
            <span className="border border-white p-[2px] lg:p-[5px]">
              {firmware}
            </span>
          </div>
          <div>
            <span>
              <b>H.W. VERSION :</b>
            </span>
            <span className="border border-white p-[2px] lg:p-[5px]">
              {hardware}
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex space-x-2">
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
        </div>
      );
    }
  }

  return (
    <header className="w-screen bg-blue-500 py-[1vh] px-[2vw] text-white h-[7vh] ">
      <div className="space-x-2 flex flex-row ">
        {buttonsAndDeviceInfo(isConnected)}
        <div className="">
          <ConnectDisconnectButton
            connectFunction={async () => {
              try {
                await invoke("reset_program_state", {});
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
              setBaudRate(0);
              setDeviceName("");
              return await disconnectFromDevice();
            }}
            className="h-[5vh] inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          />
        </div>
        <div className={`${isConnected ? "" : "hidden"}`}>
          <ConfigModeToggle retries={10} interval={1} />
        </div>
      </div>
    </header>
  );
}

export default Header;
