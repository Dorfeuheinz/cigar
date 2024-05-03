import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";

async function fetchOptions() {
  return (await invoke("get_devices")) as string[];
}

interface SelectProps {
  onSelected: (selectedOption: string) => void;
  className: string;
  value: string;
}

const DeviceSelect: React.FC<SelectProps> = ({
  onSelected,
  className,
  value,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>(value);

  useEffect(() => {
    fetchOptionsData();
  }, [fetchOptions]);

  const fetchOptionsData = async () => {
    const data = await fetchOptions(); // Call the function to fetch options
    setOptions(data);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedOption(selectedValue);
    onSelected(selectedValue);
  };

  const handleReloadOptions = () => {
    fetchOptionsData();
  };

  return (
    <>
      <div className="flex items-start gap-2">
        <select
          className={`${className} `}
          value={selectedOption}
          onChange={handleSelectChange}
        >
          <option value="" defaultValue={"true"}>
            Select Device
          </option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleReloadOptions}
          className=" h-[5vh] text-blue-700 border border-blue-700 hover:bg-blue-700 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-xs text-center inline-flex items-center dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:focus:ring-blue-800 dark:hover:bg-blue-500"
        >
          <svg
            className="w-4 h-4 mx-1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

export default DeviceSelect;
