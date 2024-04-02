import { useState } from "react";
import { Button } from "flowbite-react";

type ButtonCompProps = {
  name: string;
  placeholder: string;
  buttonFunction: () => Promise<any>;
};

const ButtonComp: React.FC<ButtonCompProps> = ({
  name,
  buttonFunction,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState<any>(null);

  const handlebutton = async () => {
    let result = await buttonFunction();
    setInputValue(result);
  };

  return (
    <div className="w-full text-center text-xs flex flex-row overflow-y-auto lg:justify-around sm:justify-between">
      <div className="mt-2 mb-2 md:w-[50%] sm:w-[50%] text-left p-3 pl-4 border bg-gray-50 rounded-lg text-gray-700">
        {inputValue ? inputValue : placeholder}
      </div>
      <div className="md:w-[40%] sm:w-[40%] mt-2">
        <Button className="w-full" onClick={handlebutton}>
          {name}
        </Button>
      </div>
    </div>
  );
};

export default ButtonComp;
