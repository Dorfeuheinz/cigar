import React, { useState } from "react";

interface InputWithDatalistProps {
  optionsProvider: () => string[];
  onValueChanged: (value: string) => void;
  className: string;
  placeholder?: string;
}
const InputWithDatalist: React.FC<InputWithDatalistProps> = ({
  optionsProvider,
  onValueChanged,
  className,
  placeholder = "",
}) => {
  const [inputValue, setInputValue] = useState("19200");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChanged(newValue);
  };

  const renderOptions = () => {
    const options = optionsProvider();
    return options.map((option) => <option key={option} value={option} />);
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        list="datalistOptions"
        className={className}
        placeholder={placeholder}
      />
      <datalist id="datalistOptions">{renderOptions()}</datalist>
    </div>
  );
};

export default InputWithDatalist;
