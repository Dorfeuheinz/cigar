import { useState } from "react";
import { Button, TextInput } from "flowbite-react";

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
  const [inputValue, setInputValue] = useState<any>();

  const handlebutton = async () => {
    let result = await buttonFunction();
    setInputValue(result);
  };

  return (
    <div className="w-full text-center text-xs flex flex-row overflow-y-auto lg:justify-around sm:justify-between">
      <div className="mt-2 mb-2 md:w-[50%] md:w-max-[50%] sm:w-[50%]">
        <TextInput
          className=""
          placeholder={`${placeholder}`}
          value={inputValue}
          disabled
        ></TextInput>
      </div>
      <div className="md:w-[40%] sm:w-[40%] mt-2">
        <Button className="w-full" onClick={handlebutton}>
          {" "}
          {name}{" "}
        </Button>
      </div>
    </div>
  );
};

export default ButtonComp;
