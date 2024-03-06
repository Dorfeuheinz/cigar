import CommunicationPanel from "./CommunicationPanel";
import ConfigPanel from "./ConfigPanel";

function ConfigAndCommunicationTab() {
  return (
    <>
      <div className="flex flex-row space-x-2 mx-2">
        <div className="w-1/2 h-full w-1/2">
          <ConfigPanel />
        </div>
        <div className="w-1/2 h-full w-1/2">
          <CommunicationPanel />
        </div>
      </div>
    </>
  );
}

export default ConfigAndCommunicationTab;
