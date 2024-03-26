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
    setIsConnected,
    setCurrentMode,
    currentMode,
    model,
    firmware,
    hardware,
    setModel,
    setFirmware,
    setHardware,
  } = useContext(ConnectionContext);

  function buttonsAndDeviceInfo(isConnected: boolean) {
    if (isConnected && currentMode === "configuration") {
      return (
        <div className=" text-xs flex space-x-1 p-[1vh] h-[5vh] md:space-x-4">
          <div>
            <span>
              <b>Model :</b>
            </span>
            <span className="">{model}</span>
          </div>
          <div>
            <span>
              <b>F.W. VERSION :</b>
            </span>
            <span className="">{firmware}</span>
          </div>
          <div>
            <span>
              <b>H.W. VERSION :</b>
            </span>
            <span className="">{hardware}</span>
          </div>
        </div>
      );
    } else if (isConnected) {
      return <></>;
    } else {
      const BaudRateList = [
        "110",
        "300",
        "600",
        "1200",
        "2400",
        "4800",
        "9600",
        "14400",
        "19200",
        "28800",
        "38400",
        "56000",
        "57600",
        "115200",
        "230400",
      ];
      return (
        <div className="flex space-x-2">
          <div className="">
            <InputWithDatalist
              optionsProvider={() => BaudRateList}
              onValueChanged={(value) => {
                let parsedValue = parseInt(value);
                setBaudRate(parsedValue);
              }}
              className="rounded-md border-gray-300 text-xs text-black h-[5vh] p-0 px-[5px]"
              placeholder="Baud Rate"
            />
          </div>
          <div className="">
            <DeviceSelect
              value={deviceName}
              className="rounded-md p-0 px-[5px] text-xs border-gray-300 h-[5vh] text-black"
              onSelected={setDeviceName}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <header className="w-screen bg-blue-500 py-[1vh] pl-[4px] text-white h-[7vh] ">
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
                setIsConnected(true);
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
              let result = await disconnectFromDevice();
              await invoke("reset_program_state", {});
              if (result) {
                setIsConnected(false);
                setModel("");
                setFirmware("");
                setHardware("");
              }
              return result;
            }}
            className="h-[5vh] inline-flex items-center rounded-lg bg-blue-700 px-[5px] py-2.5 text-center text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
