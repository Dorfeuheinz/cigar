const { invoke } = window.__TAURI__.tauri;

async function populateDeviceList() {
  let devices = await invoke("get_devices", {});
  // create a list of options in deviceName select box
  let deviceOptions = document.getElementById("deviceName");
  // delete all children
  while (deviceOptions.firstChild) {
    deviceOptions.removeChild(deviceOptions.firstChild);
  }
  for (let i = 0; i < devices.length; i++) {
    let option = document.createElement("option");
    option.value = devices[i];
    option.text = devices[i];
    deviceOptions.appendChild(option);
  }
}

function setConnectionStatus(status) {
  document.getElementById("connectionStatusIcon").innerText = status ? "🟢" : "🔴";
  document.getElementById("connectionStatusText").innerText = status ? "Connected" : "Not Connected";
}

async function connectToDevice() {
  let selectedDevice = document.getElementById("deviceName").value;
  let selectedBaudRate = document.getElementById("baudRate").value;
  console.info(`Connecting to ${selectedDevice} at ${selectedBaudRate}.`);
  let result = await invoke("connect_to_device", { deviceName: selectedDevice, baudRate: parseInt(selectedBaudRate) });
  setConnectionStatus(result);
  console.info(`Connecting to ${selectedDevice} at ${selectedBaudRate}. Result: ${result}`);
}

async function disconnectFromDevice() {
  console.info("Disconnecting from device");
  let result = await invoke("disconnect_from_device", {});
  setConnectionStatus(!result);
  console.info(`Disconnecting from device. Result: ${result}`);
}

async function getConfigFromDevice() {
  console.info("Getting config from device");
}

async function setConfigOnDevice() {
  console.info("Setting config on device");
}

async function exportConfigToFile() {
  console.info("Exporting config to file");
}

async function importConfigFromFile() {
  console.info("Importing config from file");
}

async function sendBytes() {
  console.info("Sending bytes");
}

window.addEventListener("DOMContentLoaded", () => {
  populateDeviceList();
  document.getElementById("connectDisconnectBtn").addEventListener("click", () => {
    let currentMode = document.getElementById("connectDisconnectBtnText").innerText;
    if (currentMode === "Connect") {
      // we want to connect to the device
      document.getElementById("connectDisconnectBtnText").innerText = "Disconnect";
      connectToDevice();
    } else {
      // we want to disconnect
      document.getElementById("connectDisconnectBtnText").innerText = "Connect";
      disconnectFromDevice();
    }
  });

  document.getElementById("deviceMode").addEventListener("change", () => {
    let isConfigurationMode = document.getElementById("deviceMode").checked;
    if (isConfigurationMode) {
      document.getElementById("deviceModeText").innerText = "Configuration mode";
    } else {
      document.getElementById("deviceModeText").innerText = "Communication mode";
    }
  })

  document.getElementById("getConfigBtn").addEventListener("click", () => {
    getConfigFromDevice();
  });

  document.getElementById("setConfigBtn").addEventListener("click", () => {
    setConfigOnDevice();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    exportConfigToFile();
  });

  document.getElementById("importBtn").addEventListener("click", () => {
    importConfigFromFile();
  });

  document.getElementById("sendOnceBtn").addEventListener("click", () => {
    sendBytes();
  });

  document.getElementById("sendRepeatedlyBtn").addEventListener("click", () => {
    sendBytes();
  })

});