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

const TerminalPanel: React.FC<TerminalPanelProps> = ({ }) => {
  let [logs, setLogs] = useState<EventPayload[]>([]);
  const [displayMode, setDisplayMode] = useState("hex");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
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

  const handleSelectChange = (e: any) => {
    setDisplayMode(e.target.value);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <>
      <div className="h-[4vh] w-full border bg-gray-50 border-b-0 flex justify-end">
        <div>
          <select
            className="h-[3.8vh] max-h[30px] text-sm p-0 pl-2 ml-2 bg-blue-600 text-white border border-blue-950 rounded-lg hover:bg-blue-900 lg:text-lg"
            onChange={handleSelectChange}
          >
            <option value="hex" key="hex">Hex</option>
            <option value="decimal" key="decimal">Decimal</option>
            <option value="ascii" key="ascii">ASCII</option>
          </select>
        </div>
        &emsp;
        <div>
          <button
            className="h-[3.8vh] max-h[35px] text-sm px-2 mr-5 bg-red-600 text-white border border-blue-950 rounded-lg hover:bg-blue-900 lg:text-lg"
            onClick={clearLogs}
          >
            Clear
          </button>
        </div>
      </div>
      <div className={`h-[21vh] overflow-y-auto`}>
        {logs.map((log, index) => (
            <p className="h-fit" key={index}>
              <b>[{log.data_type}]</b>&nbsp;
              <b>[{log.time}]</b>&nbsp;
              {log.data
                .map((elem, _index) => {
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
        ))}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
};

export default TerminalPanel;
