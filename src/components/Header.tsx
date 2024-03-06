import Switcher12 from "./Switcher12";
import { HiOutlineArrowRight } from "react-icons/hi";
import { useContext, useState } from "react";
import DeviceSelect from "./DeviceSelect";
import InputWithDatalist from "./InputWithDatalist";
import StateButton from "./StateButton";
import {
  connectToDevice,
  disconnectFromDevice,
} from "../utils/connection_util";

import { ConnectionContext } from "../App";
import Timer from "./Timer";

function Header() {
  const [baudRate, setBaudRate] = useState<number>(19200);
  const [deviceName, setDeviceName] = useState("");
  const { isConnected, setIsConnected } = useContext(ConnectionContext);

  return (
    <header className="w-full justify-between bg-blue-500 p-2 text-white">
      <div className="space-x-4">
        <div className="inline-block">
          <b>Tiny CC Tool</b>
        </div>
        <div className="inline-block">
          <InputWithDatalist
            optionsProvider={() => ["19200", "115200"]}
            onValueChanged={(value) => {
              let parsedValue = parseInt(value);
              setBaudRate(parsedValue);
            }}
            className="rounded-md border-gray-300 text-black"
            placeholder="Baud Rate"
          />
        </div>
        <div className="inline-block">
          <DeviceSelect
            className="rounded-md border-gray-300 text-black"
            onSelected={setDeviceName}
          />
        </div>
        <div className="inline-block">
          <StateButton
            text1="Connect"
            text2="Disconnect"
            asyncFunction1={async () => {
              return await connectToDevice(deviceName, baudRate);
            }}
            asyncFunction2={async () => {
              return await disconnectFromDevice();
            }}
            onStateChange={(state) => {
              setIsConnected(state === "Disconnect");
            }}
            className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          />
        </div>
        <div className="inline-block">
          {/* <Switcher12
            checked={isConnected}
            label="Communication Mode"
            onChange={setIsConnected}
          /> */}
          <Timer />
        </div>
      </div>
    </header>
  );
}

export default Header;
