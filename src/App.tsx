import { Tabs } from "flowbite-react";
import { HiAdjustments, HiClipboardList, HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";

import Header from "./components/Header";
import ConfigAndCommunicationTab from "./components/ConfigAndCommunicationTab";

function App() {
  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-scroll">
          <Tabs aria-label="Tabs with underline" style="underline">
            <Tabs.Item
              title="Configuration and Communication"
              icon={HiAdjustments}
              disabled
            >
              <ConfigAndCommunicationTab />
            </Tabs.Item>
            <Tabs.Item title="Calibration" icon={HiClipboardList} disabled>
              This is{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                Contacts tab's associated content
              </span>
              . Clicking another tab will toggle the visibility of this one for
              the next. The tab JavaScript swaps classes to control the content
              visibility and styling.
            </Tabs.Item>
            <Tabs.Item
              disabled
              title="Device Information"
              icon={HiClipboardList}
            >
              Disabled content
            </Tabs.Item>
          </Tabs>
        </div>
        <div
          className="flex-1 w-full border-t overflow-y-scroll"
          style={{ minHeight: "30vh", maxHeight: "30vh" }}
        >
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
          Something
          <br />
        </div>
        <footer className="w-full p-1 bg-gray-500">
          <div id="connectionStatus" className="text-center text-white">
            <span id="connectionStatusIcon"></span>
            Connection Status: <span id="connectionStatusText"></span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
