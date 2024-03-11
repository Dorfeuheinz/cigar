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
    <div className="w-full text-center flex flex-row justify-around overflow-y-auto">
      <div className="mt-2 mb-2 md:w-1/3">
        <TextInput
          className=""
          placeholder={`${placeholder}`}
          value={inputValue}
        ></TextInput>
      </div>
      <div className="md:w-1/2 mt-2">
        <Button className="w-full" onClick={handlebutton}>
          {" "}
          {name}{" "}
        </Button>
      </div>
    </div>
  );
};

export default ButtonComp;
