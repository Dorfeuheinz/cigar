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
      <select value={selectedOption} onChange={handleSelectChange}>
        <option value="" selected>
          Select Quick Mode / Test Mode
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

      <button onClick={handleExecuteSelectedTestMode}>Go</button>
    </>
  );
};

export default TestModeSelect;
