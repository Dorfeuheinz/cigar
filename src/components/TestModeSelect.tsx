import { useState } from "react";

import { MkDeviceTestMode, MkDeviceQuickMode } from "../DataTypes";
import { invoke } from "@tauri-apps/api";

type TestModeSelectOptions = {
  testModeOptions: MkDeviceTestMode[];
  quickOptions: MkDeviceQuickMode[];
};

const TestModeSelect: React.FC<TestModeSelectOptions> = ({
  testModeOptions,
  quickOptions,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [lastExecutedOption, setLastExecutedOption] = useState<string>("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedOption(selectedValue);
  };

  const executeSequenceOffForLastOption = async () => {
    if (
      lastExecutedOption != "" &&
      lastExecutedOption.startsWith("TESTMODE_")
    ) {
      const testModeId = parseInt(lastExecutedOption.split("_")[1]);
      let sequenceOffExecutionSuccess: boolean = await invoke(
        "execute_mode_sequence",
        {
          sequenceStr: testModeOptions[testModeId].sequence_off,
        }
      );
      if (sequenceOffExecutionSuccess) {
        setLastExecutedOption("");
      }
    } else if (
      lastExecutedOption != "" &&
      lastExecutedOption.startsWith("QUICKMODE_")
    ) {
      const quickModeId = parseInt(lastExecutedOption.split("_")[1]);
      let sequenceOffExecutionSuccess: boolean = await invoke(
        "execute_mode_sequence",
        {
          sequenceStr: quickOptions[quickModeId].sequence_off,
        }
      );
      if (sequenceOffExecutionSuccess) {
        setLastExecutedOption("");
      }
    }
  };

  const handleExecuteSelectedTestMode = async () => {
    await invoke("stop_communication_task", {});
    await executeSequenceOffForLastOption();
    if (selectedOption.startsWith("TESTMODE_")) {
      const testModeId = parseInt(selectedOption.split("_")[1]);
      let sequenceOnExecutionSuccess: boolean = await invoke(
        "execute_mode_sequence",
        {
          sequenceStr: testModeOptions[testModeId].sequence_on,
        }
      );
      if (sequenceOnExecutionSuccess) {
        setLastExecutedOption(selectedOption);
      }
    } else if (selectedOption.startsWith("QUICKMODE_")) {
      const quickModeId = parseInt(selectedOption.split("_")[1]);
      let sequenceOnExecutionSuccess: boolean = await invoke(
        "execute_mode_sequence",
        {
          sequenceStr: quickOptions[quickModeId].sequence_on,
        }
      );
      if (sequenceOnExecutionSuccess) {
        setLastExecutedOption(selectedOption);
      }
    }
    await invoke("start_communication_task", {});
  };
  return (
    <>
      <div className="h-full flex flex-row mt-[2px]  md:flex md:flex-row">
        <div>
          <select
            value={selectedOption}
            onChange={handleSelectChange}
            className="w-full rounded-lg text-xs p-0 pl-2 pr-0 sm:py-1  bg-blue-600 text-white lg:p-2 "
          >
            <option value="" defaultValue={"true"}>
              Select Mode
            </option>
            <optgroup label="Quick Options">
              {quickOptions.map((option, index) => (
                <option key={index} value={`QUICKMODE_${index}`}>
                  {option.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Test Mode">
              {testModeOptions.map((option, index) => (
                <option key={index} value={`TESTMODE_${index}`}>
                  {option.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="ml-2">
          <button
            className="sm:mt-1 px-3 bg-blue-700 text-white text-xs rounded-lg lg:p-2 lg:mt-0.5 "
            onClick={handleExecuteSelectedTestMode}
          >
            Go
          </button>
        </div>
      </div>
    </>
  );
};

export default TestModeSelect;
