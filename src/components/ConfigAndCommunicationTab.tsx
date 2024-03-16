import CommunicationPanel from "./CommunicationPanel";
import ConfigPanel from "./ConfigPanel";

function ConfigAndCommunicationTab() {
  return (
    <>
      <div
        className="flex flex-row space-x-2 mx-2 p2"
        style={{ minHeight: "50vh", maxHeight: "50vh" }}
      >
        <div className="w-1/2">
          <ConfigPanel />
        </div>
        <div className="w-1/2 max-h-full">
          <CommunicationPanel />
        </div>
      </div>
    </>
  );
}

export default ConfigAndCommunicationTab;
