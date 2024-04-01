import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { Tooltip } from "flowbite-react";

function CommunicationPanel() {
  const [communicationInput, setCommunicationInput] = useState<string>("");
  const [sendInterval, setSendInterval] = useState(1000);
  const [intervalRunning, setIntervalRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const handleSubmit = async () => {
    await invoke("send_bytes", {
      input: communicationInput,
    });
  };

  const handleRepeatToggle = () => {
    if (intervalRunning) {
      clearInterval(intervalId!);
      setIntervalRunning(false);
      setSendInterval(sendInterval); // Reset the interval to default value
    } else {
      const id = setInterval(async () => {
        await handleSubmit();
      }, sendInterval);
      setIntervalId(id);
      setIntervalRunning(true);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <>
      <div className="w-full mb-4 border text-xs border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
        <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
          <label htmlFor="comment" className="sr-only">
            Your message
          </label>
          <textarea
            rows={4}
            spellCheck={false}
            className="w-full px-0 text-xs text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
            placeholder="Write a message..."
            onChange={(e) => setCommunicationInput(e.target.value)}
            disabled={intervalRunning}
            required
          />
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
          <span className="flex items-center space-x-2">
            <Tooltip content="Send" placement="top" style="dark">
              <button
                onClick={handleSubmit}
                className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg hover:bg-cyan-200"
                disabled={intervalRunning}
              >
                <svg
                  width="24px"
                  height="24px"
                  viewBox="-3 0 28 28"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier"></g>
                  <g id="SVGRepo_tracerCarrier"></g>
                  <g id="SVGRepo_iconCarrier">
                    <title>play</title> <desc>Created with Sketch Beta.</desc>
                    <defs> </defs>
                    <g id="Page-1" stroke="none" fill="none">
                      <g
                        id="Icon-Set-Filled"
                        transform="translate(-419.000000, -571.000000)"
                        fill="#000000"
                      >
                        <path
                          d="M440.415,583.554 L421.418,571.311 C420.291,570.704 419,570.767 419,572.946 L419,597.054 C419,599.046 420.385,599.36 421.418,598.689 L440.415,586.446 C441.197,585.647 441.197,584.353 440.415,583.554"
                          id="play"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
              </button>
            </Tooltip>

            {intervalRunning ? (
              <Tooltip content="Cancel" placement="top" style="dark">
                <button
                  onClick={handleRepeatToggle}
                  className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white rounded-lg hover:bg-red-200"
                >
                  <svg
                    width="24px"
                    height="24px"
                    viewBox="-1 0 8 8"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#000000"
                  >
                    <g id="SVGRepo_bgCarrier"></g>
                    <g id="SVGRepo_tracerCarrier"></g>
                    <g id="SVGRepo_iconCarrier">
                      <title>pause [#1006]</title>
                      <desc>Created with Sketch.</desc> <defs> </defs>
                      <g id="Page-1" stroke="none" fill="none">
                        <g
                          id="Dribbble-Light-Preview"
                          transform="translate(-227.000000, -3765.000000)"
                          fill="#000000"
                        >
                          <g
                            id="icons"
                            transform="translate(56.000000, 160.000000)"
                          >
                            <path
                              d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606"
                              id="pause-[#1006]"
                            ></path>
                          </g>
                        </g>
                      </g>
                    </g>
                  </svg>
                </button>
              </Tooltip>
            ) : (
              <Tooltip content="Send Repeatedly" placement="top" style="dark">
                <button
                  onClick={handleRepeatToggle}
                  className="inline-flex items-center py-1 px-2 text-xs font-medium text-center text-white rounded-lg hover:bg-cyan-200"
                >
                  <svg
                    width="40px"
                    height="40px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier"></g>
                    <g id="SVGRepo_tracerCarrier"></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        d="M12.0476 13.5826L4.5 17.9402C3.83333 18.3251 3 17.844 3 17.0742V8.00152C3 7.23171 3.83333 6.75059 4.5 7.13549L12.0476 11.4931V8.00151C12.0476 7.23171 12.881 6.75058 13.5476 7.13548L21.4048 11.6718C22.0714 12.0567 22.0714 13.019 21.4048 13.4039L13.5476 17.9402C12.881 18.3251 12.0476 17.844 12.0476 17.0742V13.5826Z"
                        fill="#000000"
                      ></path>
                    </g>
                  </svg>
                </button>
              </Tooltip>
            )}
          </span>
          &emsp;
          <input
            type="text"
            aria-describedby="Send interval in milliseconds"
            className="border-gray-300 h-11 w-[8.5em] md:w-[16em] lg:w-[16em] rounded-lg text-center float-right text-gray-900 text-xs focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={sendInterval}
            disabled={intervalRunning}
            onChange={(e) => setSendInterval(parseInt(e.target.value))}
            required
          />
        </div>
      </div>
    </>
  );
}

export default CommunicationPanel;
