import Switcher12 from "./Switcher12";

function Header() {
  return (
    <header className="w-full justify-between bg-blue-500 p-2 text-white">
      <div className="space-x-4">
        <div className="inline-block">
          <b>Tiny CC Tool</b>
        </div>
        <div id="baudRateInputBox" className="inline-block">
          <label htmlFor="baudRate" className="mr-2">
            Baud Rate
          </label>
          <input
            list="baudRateList"
            name="baudRate"
            id="baudRate"
            className="rounded-md border-gray-300 text-black"
            size={8}
          />
          <datalist id="baudRateList">
            <option value="9600" />
            <option value="14400" />
            <option value="19200" />
          </datalist>
        </div>
        <div className="inline-block">
          <label htmlFor="deviceName" className="mr-2">
            Device Name
          </label>
          <select
            id="deviceName"
            className="rounded-md border-gray-300 text-black"
          ></select>
        </div>
        <div className="inline-block">
          <button
            id="connectDisconnectBtn"
            type="button"
            className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <div id="connectDisconnectBtnText">Connect</div>&nbsp;
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
        </div>
        <div id="deviceModeSwitchBox" className="inline-block">
          <Switcher12 />
        </div>
      </div>
    </header>
  );
}

export default Header;
