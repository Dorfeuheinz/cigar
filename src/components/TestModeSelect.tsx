import { useState } from "react";

import { MkDeviceTestMode, MkDeviceQuickMode } from "../DataTypes";

type TestModeSelectOptions = {
  testModeOptions: MkDeviceTestMode[];
  quickOptions: MkDeviceQuickMode[];
};

const TestModeSelect: React.FC<TestModeSelectOptions> = ({
  testModeOptions,
  quickOptions,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedOption(selectedValue);
  };

  const handleExecuteSelectedTestMode = () => {
    console.log(selectedOption);
  };
  return (
    <>
      <div className="h-full flex">
        <div>
          <select
            value={selectedOption}
            onChange={handleSelectChange}
            className="w-fit h-full bg-gray-50 text-sm rounded-lg "
          >
            <option value="" selected>
              Select Mode
            </option>
            <optgroup label="Quick Options">
              {quickOptions.map((option, index) => (
                <option key={index} value={`QUICKMODE_${option.testmode_id}`}>
                  {option.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Test Mode">
              {testModeOptions.map((option, index) => (
                <option key={index} value={`TESTMODE_${option.testmode_id}`}>
                  {option.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="ml-5">
          <button
            className="sm:mt-2 pl-5 pr-5 bg-blue-700 text-white text-sm rounded-lg"
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
