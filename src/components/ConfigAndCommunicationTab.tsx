import CommunicationPanel from "./CommunicationPanel";
import ConfigPanel from "./ConfigPanel";

function ConfigAndCommunicationTab() {
  return (
    <>
      <div className="flex flex-row space-x-2 mx-2 h-[53vh] mt-[-10px]">
        <div className="w-1/2">
          <ConfigPanel />
        </div>
        <div className="w-1/2 h-[55vh]">
          <CommunicationPanel />
        </div>
      </div>
    </>
  );
}

export default ConfigAndCommunicationTab;
