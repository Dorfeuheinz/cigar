import { listen } from "@tauri-apps/api/event";
import { useState } from "react";

interface EventPayload {
    data_type: string;
    data: string;
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

function TerminalPanel() {
    let [content, setContent] = useState("");
    const unlisten = listen<EventPayload>("exchange_bytes_event", (event) => {
        content +=
          "<b>" +
          event.payload.data_type +
          " [" +
          getCurrentTime() +
          "]</b>: " +
          event.payload.data +
          "<br/>";
        setContent(content);
        
      });
    return (
        <>
        {
            content
        }
        </>
    )
}

export default TerminalPanel;