// @ts-nocheck
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import React from "react";

interface EventPayload {
  data_type: string;
  data: string;
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
  }, []);

  return (
    <>
      {logs.map((log, index) => (
        <>
          <p key={index}>
            <b>[{log.data_type}]</b>&nbsp;
            <b>[{log.time}]</b>&nbsp;
            {log.data}
          </p>
          <hr />
        </>
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};

export default TerminalPanel;
