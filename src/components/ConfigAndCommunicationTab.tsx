import CommunicationPanel from "./CommunicationPanel";
import ConfigPanel from "./ConfigPanel";

function ConfigAndCommunicationTab() {
  return (
    <>
      <div className="flex flex-1 space-x-2 mx-2">
        <div className="w-1/2">
          <ConfigPanel />
        </div>
        <div className="w-1/2">
          <CommunicationPanel />
        </div>
      </div>
    </>
  );
}

export default ConfigAndCommunicationTab;
