const { invoke } = window.__TAURI__.tauri;
const { once } = window.__TAURI__.event;

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
  document.getElementById("connectDisconnectBtnText").innerText = status ? "Disconnect" : "Connect";
}

async function connectToDevice() {
  let selectedDevice = document.getElementById("deviceName").value;
  let selectedBaudRate = document.getElementById("baudRate").value;
  console.info(`Connecting to ${selectedDevice} at ${selectedBaudRate}.`);
  let result = await invoke("connect_to_device", { deviceName: selectedDevice, baudRate: parseInt(selectedBaudRate) });
  setConnectionStatus(result);
  console.info(`Connecting to ${selectedDevice} at ${selectedBaudRate}. Result: ${result}`);
  toggleConfigurationMode(false);
}

async function disconnectFromDevice() {
  console.info("Disconnecting from device");
  let result = await invoke("disconnect_from_device", {});
  setConnectionStatus(!result);
  console.info(`Disconnecting from device. Result: ${result}`);
  toggleConfigurationMode(false);
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
  let input = document.getElementById("msgTextArea").value;
  console.log("input from text Area", input);
  // create a u8 byte array
  let result = await invoke("send_bytes", { input: input });
  console.info(`Sending bytes. Result: ${result}`);
}

async function toggleConfigurationMode(shouldSwitchToConfigMode) {
  if (shouldSwitchToConfigMode) {
    let count = 10;
    let success = false;
    const countdownInterval = setInterval(() => {
      if (count == 0 || success) {
        if (success) {
          document.getElementById("deviceModeText").innerText = "Config mode";
        } else {
          document.getElementById("deviceModeText").innerText = "Communication mode";
          document.getElementById("deviceMode").checked = false;
        }
        clearInterval(countdownInterval);
      } else {
        invoke("read_bytes", {})
        .then((result) => {
          if (result && result.length === 1 && result[0] === 62) {
            success = true;
          }
        });
        if (!success) {
          document.getElementById("deviceModeText").innerText = `Waiting for device (${count})`;
          count--;
        }
      }
    }, 1000);
    
  } else {
    // switch back to communication mode
    let result = await invoke("send_bytes", { input: "X" });
    if (result) {
      document.getElementById("deviceModeText").innerText = "Communication mode";
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  populateDeviceList();

  document.getElementById("connectDisconnectBtn").addEventListener("click", () => {
    let currentMode = document.getElementById("connectDisconnectBtnText").innerText;
    if (currentMode === "Connect") {
      // we want to connect to the device
      connectToDevice();
    } else {
      // we want to disconnect from the device
      disconnectFromDevice();
    }
  });

  document.getElementById("deviceMode").addEventListener("click", () => {
    let shouldSwitchToConfigMode = document.getElementById("deviceMode").checked;
    toggleConfigurationMode(shouldSwitchToConfigMode);
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