const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;

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
  if (status) {
    document.getElementById("connectionStatusIcon").innerText = "🟢";
    document.getElementById("connectionStatusText").innerText = "Connected";
    document.getElementById("baudRateInputBox").classList.add("hidden");
    document.getElementById("deviceModeSwitchBox").classList.remove("hidden");
    document.getElementById("connectDisconnectBtnText").innerText = "Disconnect";
  } else {
    document.getElementById("connectionStatusIcon").innerText = "🔴";
    document.getElementById("connectionStatusText").innerText = "Not Connected";
    document.getElementById("baudRateInputBox").classList.remove("hidden");
    document.getElementById("deviceModeSwitchBox").classList.add("hidden");
    document.getElementById("connectDisconnectBtnText").innerText = "Connect";
  }
}

async function connectToDevice() {
  let selectedDevice = document.getElementById("deviceName").value;
  let selectedBaudRate = document.getElementById("baudRate").value;
  console.info(`Connecting to ${selectedDevice} at ${selectedBaudRate}.`);
  let result = await invoke("connect_to_device", {
    deviceName: selectedDevice,
    baudRate: parseInt(selectedBaudRate),
  });
  setConnectionStatus(result);
  console.info(
    `Connecting to ${selectedDevice} at ${selectedBaudRate}. Result: ${result}`
  );
  await toggleConfigurationMode(false);
}

async function disconnectFromDevice() {
  console.info("Disconnecting from device");
  await toggleConfigurationMode(false);
  let result = await invoke("disconnect_from_device", {});
  setConnectionStatus(!result);
  console.info(`Disconnecting from device. Result: ${result}`);
}

async function getConfigFromDevice() {
  console.info("Getting config from device");
  let result = await invoke("get_device_config", {});
  console.info(`Getting config from device. Result: ${JSON.stringify(result)}`);
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
  console.info(
    `Toggling configuration mode. Should switch to config mode: ${shouldSwitchToConfigMode}`
  );
  await invoke("clear_buffer", {});
  let sendSuccessful = await invoke("send_bytes", { input: "X" });
  if (shouldSwitchToConfigMode) {
    let count = 10;
    let success = false;
    const countdownInterval = setInterval(async () => {
      if (count == 0 || success) {
        if (success) {
          document.getElementById("deviceModeText").innerText = "Config mode";
          document.getElementById("deviceMode").checked = true;
        } else {
          document.getElementById("deviceModeText").innerText =
            "Communication mode";
          document.getElementById("deviceMode").checked = false;
        }
        clearInterval(countdownInterval);
      } else {
        if (sendSuccessful) {
          let readResult = await invoke("read_bytes", {});
          if (readResult && readResult.length === 1 && readResult[0] === 62) {
            success = true;
          }
        }
        if (!success) {
          document.getElementById(
            "deviceModeText"
          ).innerText = `Waiting for device (${count})`;
          count--;
        }
      }
    }, 1000);
  } else {
    // switch back to communication mode
    if (sendSuccessful) {
      document.getElementById("deviceModeText").innerText =
        "Communication mode";
      document.getElementById("deviceMode").checked = false;
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  populateDeviceList();
  document.getElementById("logWindow").innerText = "";
  document
    .getElementById("connectDisconnectBtn")
    .addEventListener("click", () => {
      let currentMode = document.getElementById(
        "connectDisconnectBtnText"
      ).innerText;
      if (currentMode === "Connect") {
        // we want to connect to the device
        connectToDevice();
      } else {
        // we want to disconnect from the device
        disconnectFromDevice();
      }
    });

  document.getElementById("deviceMode").addEventListener("click", () => {
    let shouldSwitchToConfigMode =
      document.getElementById("deviceMode").checked;
    toggleConfigurationMode(shouldSwitchToConfigMode);
  });

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
  });
});

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

  const formattedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
  return formattedTime;
}

const unlisten = listen("exchange_bytes_event", (event) => {
  document.getElementById("logWindow").innerHTML +=
    "<b>" +
    event.payload.data_type +
    " [" +
    getCurrentTime() +
    "]</b>: " +
    event.payload.data +
    "<br/>";
  // scroll to the end
  document.getElementById("logWindow").scrollTop =
    document.getElementById("logWindow").scrollHeight;
});

unlisten();
