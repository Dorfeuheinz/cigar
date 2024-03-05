import CommunicationPanel from "./CommunicationPanel";
import ConfigPanel from "./ConfigPanel";

function ConfigAndCommunicationTab() {
  return (
    <>
      <div className="flex flex-row space-x-2 mx-2">
        <div className="w-1/2 h-full w-full">
          <ConfigPanel />
        </div>
        <div className="w-1/2 h-full w-full">
          <CommunicationPanel />
        </div>
      </div>
    </>
  );
}

export default ConfigAndCommunicationTab;
