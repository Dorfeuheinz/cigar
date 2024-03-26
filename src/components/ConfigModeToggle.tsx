// @ts-nocheck
import React, { useContext, useState } from "react";
import { ConnectionContext } from "../App";
import { invoke } from "@tauri-apps/api";

interface ConfigModeToggleParams {
  retries: number;
  interval: number;
}

const ConfigModeToggle: React.FC<ConfigModeToggleParams> = ({
  retries,
  interval,
}) => {
  const { currentMode, setCurrentMode } = useContext(ConnectionContext);
  const [toggleStatusText, setToggleStatusText] = useState(
    currentMode === "configuration"
      ? "Configuration Mode"
      : "Communication Mode"
  );

  let countdownInterval: NodeJS.Timeout | null = null;

  const handleCheckboxChange = async (
    checkbox: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (checkbox.target.checked) {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      let tryCount = 0;
      countdownInterval = setInterval(async () => {
        if (tryCount < retries) {
          await invoke("stop_communication_task", {});
          setCurrentMode("waitingForConfigMode");
          setToggleStatusText(`Waiting for Device... ${retries - tryCount}`);
          let readResult: number[] = await invoke("read_bytes", {});
          let success = false;
          if (readResult && readResult.length === 1 && readResult[0] === 0x3e) {
            success = true;
          }
          if (success) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            await invoke("start_communication_task", {});
            setCurrentMode("configuration");
            setToggleStatusText("Configuration Mode");
          } else {
            tryCount++;
          }
        } else {
          clearInterval(countdownInterval);
          await invoke("send_bytes", { input: "X" });
          await invoke("start_communication_task", {});
          setCurrentMode("communication");
          setToggleStatusText("Communication Mode");
        }
      }, interval * 1000);
    } else {
      // If the checkbox is unchecked, stop the countdown and set back to communication mode
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      await invoke("send_bytes", { input: "X" });
      await invoke("start_communication_task", {});
      setCurrentMode("communication");
      setToggleStatusText("Communication Mode");
    }
  };

  return (
    <>
      <label className="themeSwitcherTwo relative inline-flex cursor-pointer select-none items-center">
        <input
          type="checkbox"
          checked={currentMode === "configuration"}
          onChange={handleCheckboxChange}
          disabled={currentMode == "waitingForConfigMode"}
          className="sr-only"
        />
        <span className="label flex items-center text-xs font-medium text-white">
          &nbsp;
        </span>
        <span
          className={`slider mx-2 flex h-8 w-[60px] items-center rounded-full p-1 duration-200 ${
            currentMode === "configuration" ||
            currentMode === "waitingForConfigMode"
              ? "bg-[#4ab267]"
              : "bg-[#CCCCCE]"
          }`}
        >
          <span
            className={`dot h-6 w-6 rounded-full bg-white duration-200 ${
              currentMode === "configuration" ||
              currentMode === "waitingForConfigMode"
                ? "translate-x-[28px]"
                : ""
            }`}
          ></span>
        </span>
        <span className="label flex items-center text-xs font-medium text-white">
          {toggleStatusText}
        </span>
      </label>
    </>
  );
};

export default ConfigModeToggle;
