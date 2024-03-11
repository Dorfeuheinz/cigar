import { invoke } from "@tauri-apps/api";
import ButtonComp from "./ButtonComp";
import RSSIChart from "./RSSIChart";

const Device_info = () => {
  const getRSSI = async () => {
    return await invoke("get_device_rssi");
  };

  const getTemperature = async () => {
    return await invoke("get_device_temperature");
  };

  const getVoltage = async () => {
    return await invoke("get_device_voltage");
  };

  return (
    <>
      <div
        className="p-2 w-full pt-0 sm:overflow-y-auto md:flex lg:flex-row md:flex-row"
        style={{ minHeight: "50vh", maxHeight: "50vh" }}
      >
        <div className="border-4 md:w-2/3 max-h-full flex-grow">
          <RSSIChart />
        </div>
        <div className="md:w-1/3 overflow-y-scroll max-h-full">
          <ButtonComp
            name="Get RSSI"
            buttonFunction={getRSSI}
            placeholder="RSSI"
          />
          <ButtonComp
            name="Get Analog (A)"
            buttonFunction={getRSSI}
            placeholder="Analog Value"
          />
          <ButtonComp
            name="Get Digital (D)"
            buttonFunction={getRSSI}
            placeholder="Digital Value"
          />
          <ButtonComp
            name="Get Temperature (U)"
            buttonFunction={getTemperature}
            placeholder="Device Temperature"
          />
          <ButtonComp
            name="Get Voltage (V)"
            buttonFunction={getVoltage}
            placeholder="Power Supply Voltage"
          />
        </div>
      </div>
    </>
  );
};
export default Device_info;
