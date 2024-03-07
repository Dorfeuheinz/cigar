import { useState } from "react";
import { Button, TextInput } from "flowbite-react";

const Buttoncomp = (props: any) => {
  const { name, button_function } = props;

  const [input_value, setInput_value] = useState();

  const handlebutton = () => {
    return setInput_value(button_function);
  };

  return (
    <div className="w-full text-center flex flex-row justify-around overflow-y-auto">
      <div className="mt-2 mb-2 md:w-1/3">
        <TextInput
          className=""
          placeholder={`${name}`}
          value={input_value}
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

export default Buttoncomp;
