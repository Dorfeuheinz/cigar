import Buttoncomp from "./ButtonComp";
import RSSIChart from "./RSSIChart";

const Device_info = () => {
  function button_function() {
    return 85;
  }

  function button_function_beta() {
    return "734u85";
  }

  function button_function_shiva() {
    return "SHIVAY";
  }

  return (
    <>
      <div
        className="p-2 w-full pt-0 sm:overflow-y-auto md:flex lg:flex-row md:flex-row"
        style={{ minHeight: "50vh", maxHeight: "50vh" }}
      >
        <div className="border-4 md:w-2/3 max-h-full flex-grow">
          <RSSIChart />
        </div>
        <div className="md:w-1/3 overflow-y-scroll max-h-full">
          <Buttoncomp
            name="get 35"
            button_function={button_function()}
          ></Buttoncomp>
          <Buttoncomp
            name="get 35"
            button_function={button_function()}
          ></Buttoncomp>
          <Buttoncomp
            name="get 35"
            button_function={button_function()}
          ></Buttoncomp>
          <Buttoncomp
            name="get 76"
            button_function={button_function_beta()}
          ></Buttoncomp>
          <Buttoncomp
            name="get shivay"
            button_function={button_function_shiva()}
          ></Buttoncomp>
          <Buttoncomp
            name="get shivay"
            button_function={button_function_shiva()}
          ></Buttoncomp>
          <Buttoncomp
            name="get shivay"
            button_function={button_function_shiva()}
          ></Buttoncomp>
          <Buttoncomp
            name="get shivay"
            button_function={button_function_shiva()}
          ></Buttoncomp>
        </div>
      </div>
    </>
  );
};
export default Device_info;
