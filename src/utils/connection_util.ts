import { invoke } from "@tauri-apps/api";

export async function connectToDevice(
  selectedDevice: string,
  selectedBaudRate: number
) {
  let result: boolean = await invoke("connect_to_device", {
    deviceName: selectedDevice,
    baudRate: selectedBaudRate,
  });
  return result;
}

export async function disconnectFromDevice() {
  let result: boolean = await invoke("disconnect_from_device", {});
  return result;
}

export async function getConnectedDevice() {
  let result: string | null = await invoke("get_connected_device", {});
  console.info(`Connected device: ${result}`);
  return result;
}
