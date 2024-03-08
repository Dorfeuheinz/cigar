import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import React from "react";

interface EventPayload {
  data_type: string;
  data: string;
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
  let [logs, setLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const unlisten = listen<EventPayload>("exchange_bytes_event", (event) => {
      console.log("Received event:", event.payload);
      setLogs((logs) =>
        logs.concat(
          `[${event.payload.data_type} ${getCurrentTime()}] ${
            event.payload.data
          }`
        )
      );
    });
    scrollToBottom();
    return () => {
      unlisten.then((f) => f());
    };
  }, [logs]);

  return (
    <>
      {logs.map((log, index) => (
        <p key={index}>{log}</p>
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};

export default TerminalPanel;
