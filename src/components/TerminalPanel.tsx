// @ts-nocheck
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import React from "react";

interface EventPayload {
  data_type: string;
  data: Array<number>;
  time: string;
}

interface TerminalPanelProps {
  size: number;
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

  const formattedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
  return formattedTime;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ size }) => {
  let [logs, setLogs] = useState<EventPayload[]>([]);
  const [displayMode, setDisplayMode] = useState("hex");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const unlisten = listen<EventPayload>("exchange_bytes_event", (event) => {
      setLogs((logs) =>
        logs.concat({
          data: event.payload.data,
          data_type: event.payload.data_type,
          time: getCurrentTime(),
        })
      );
    });
    scrollToBottom();
    return () => {
      unlisten.then((f) => f());
    };
  }, [logs]);

  const handleSelectChange = (e) => {
    setDisplayMode(e.target.value);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <>
      <div className="h-full">
        <div
          className="h-[5vh] w-full sticky top-0 border border-gray-300 bg-gray-50 flex justify-between pt-[0.5vh] md:pt-[0.5vh] lg:pt-[0.5vh]
      "
        >
          <div className="h-[3.5vh] ml-2">
            <select
              className="h-[3.5vh] text-xs p-0 pl-2 bg-blue-600 text-white border border-blue-950 rounded-lg hover:bg-blue-900  "
              onChange={handleSelectChange}
            >
              <option value="hex">Hex</option>
              <option value="decimal">Decimal</option>
              <option value="ascii">ASCII</option>
            </select>
          </div>
          <div>
            <button
              className="text-xs h-[3.5vh] px-2 mr-5 bg-red-600 text-white border border-blue-950 rounded-lg hover:bg-red-900  "
              onClick={clearLogs}
            >
              Clear
            </button>
          </div>
        </div>
        <div className=" overflow-y-auto h-[20vh] w-full fixed ">
          {logs.map((log, index) => (
            <>
              <p key={index} className="text-xs px-4">
                <b>[{log.data_type}]</b>&nbsp;
                <b>[{log.time}]</b>&nbsp;
                {log.data
                  .map((elem, index) => {
                    if (displayMode == "hex") {
                      return elem.toString(16).padStart(2, "0").toUpperCase();
                    } else if (displayMode == "decimal") {
                      return elem.toString(10).padStart(3, "0");
                    } else if (displayMode == "ascii") {
                      return String.fromCharCode(elem);
                    }
                  })
                  .join(" ")}
              </p>
              <hr />
            </>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </>
  );
};

export default TerminalPanel;
