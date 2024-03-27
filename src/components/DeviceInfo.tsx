import ButtonComp from "./ButtonComp";
import RSSIChart from "./RSSIChart";
import { invoke } from "@tauri-apps/api";
import { useState, createContext } from "react";

import {
  getRSSI,
  getTemperature,
  getVoltage,
  getAnalog,
  getDigital,
} from "../utils/device_info_util";

const getRSSIBtnFunc = async () => {
  await invoke("stop_communication_task", {});
  let result = await getRSSI();
  await invoke("start_communication_task", {});
  return result;
};

const getAnalogBtnFunc = async () => {
  await invoke("stop_communication_task", {});
  let result = await getAnalog();
  await invoke("start_communication_task", {});
  return result;
};

const getDigitalBtnFunc = async () => {
  await invoke("stop_communication_task", {});
  let result = await getDigital();
  await invoke("start_communication_task", {});
  return result;
};

const getTemperatureBtnFunc = async () => {
  await invoke("stop_communication_task", {});
  let result = await getTemperature();
  await invoke("start_communication_task", {});
  return result;
};

const getVoltageBtnFunc = async () => {
  await invoke("stop_communication_task", {});
  let result = await getVoltage();
  await invoke("start_communication_task", {});
  return result;
};

export const RssiStreamContext = createContext({
  rssiStreamRunning: false,
  setRssiStreamRunning: (_: boolean) => {},
});

const DeviceInfo = () => {
  const [rssiStreamRunning, setRssiStreamRunning] = useState(false);

  return (
    <>
      <div
        className="p-2 w-full pt-0 sm:overflow-y-auto lg:flex lg:flex-row "
        style={{ minHeight: "50vh", maxHeight: "50vh" }}
      >
        <RssiStreamContext.Provider
          value={{
            rssiStreamRunning: rssiStreamRunning,
            setRssiStreamRunning: setRssiStreamRunning,
          }}
        >
          <div className="border-4 lg:w-2/3 max-h-full flex-grow">
            <RSSIChart />
          </div>
          <div
            className={`lg:w-1/3 overflow-y-scroll max-h-full ${
              rssiStreamRunning ? "hidden" : ""
            }`}
          >
            <ButtonComp
              name="Get RSSI"
              buttonFunction={getRSSIBtnFunc}
              placeholder="RSSI"
            />
            <ButtonComp
              name="Get Analog (A)"
              buttonFunction={getAnalogBtnFunc}
              placeholder="Analog Value"
            />
            <ButtonComp
              name="Get Digital (D)"
              buttonFunction={getDigitalBtnFunc}
              placeholder="Digital Value"
            />
            <ButtonComp
              name="Get Temperature (U)"
              buttonFunction={getTemperatureBtnFunc}
              placeholder="Device Temperature"
            />
            <ButtonComp
              name="Get Voltage (V)"
              buttonFunction={getVoltageBtnFunc}
              placeholder="Power Supply Voltage"
            />
          </div>
        </RssiStreamContext.Provider>
      </div>
    </>
  );
};
export default DeviceInfo;
