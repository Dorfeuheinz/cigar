import React, { useState } from "react";

type StateButtonProps = {
  text1: string;
  text2: string;
  asyncFunction1: () => Promise<boolean>;
  asyncFunction2: () => Promise<boolean>;
  onStateChange: (arg: string) => void;
  className: string;
};

const StateButton: React.FC<StateButtonProps> = ({
  text1,
  text2,
  asyncFunction1,
  asyncFunction2,
  onStateChange,
  className,
}) => {
  const [buttonText, setButtonText] = useState(text1);

  const handleButtonClick = async () => {
    try {
      if (buttonText === text1) {
        const result1 = await asyncFunction1();
        if (result1) {
          setButtonText(text2);
          onStateChange(text2);
        }
      } else {
        const result2 = await asyncFunction2();
        if (result2) {
          setButtonText(text1);
          onStateChange(text1);
        }
      }
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  return (
    <button type="button" onClick={handleButtonClick} className={className}>
      <div id="connectDisconnectBtnText">{buttonText}</div>&nbsp;
      <svg
        className="ms-2 h-3.5 w-3.5 rtl:rotate-180"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 14 10"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M1 5h12m0 0L9 1m4 4L9 9"
        />
      </svg>
    </button>
  );
};

export default StateButton;
