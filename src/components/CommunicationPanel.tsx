import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";

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

  const handleDecrementInterval = () => {
    if (sendInterval > 1) {
      setSendInterval(sendInterval - 1);
    }
  };

  const handleIncrementInterval = () => {
    setSendInterval(sendInterval + 1);
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
      <div className="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
        <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
          <label htmlFor="comment" className="sr-only">
            Your message
          </label>
          <textarea
            rows={4}
            spellCheck={false}
            className="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
            placeholder="Write a message..."
            onChange={(e) => setCommunicationInput(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600">
          <span className="flex items-center space-x-2">
            <button
              onClick={handleSubmit}
              className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800"
            >
              Send
            </button>
            <button
              onClick={handleRepeatToggle}
              className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800"
            >
              {intervalRunning ? "Cancel" : "Send Repeatedly"}
            </button>
          </span>

          <div className="flex ps-0 space-x-1 rtl:space-x-reverse sm:ps-2">
            <div className="relative flex items-center max-w-[10rem]">
              <button
                type="button"
                onClick={handleDecrementInterval}
                className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
              >
                <svg
                  className="w-3 h-3 text-gray-900 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 18 2"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 1h16"
                  />
                </svg>
              </button>
              <input
                type="text"
                aria-describedby="Send interval in milliseconds"
                className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={sendInterval}
                disabled={intervalRunning}
                onChange={(e) => setSendInterval(parseInt(e.target.value))}
                required
              />
              <button
                type="button"
                onClick={handleIncrementInterval}
                className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
              >
                <svg
                  className="w-3 h-3 text-gray-900 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 18 18"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 1v16M1 9h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CommunicationPanel;
