import { invoke } from "@tauri-apps/api";

export async function getRSSI() {
  return await invoke("get_device_rssi");
}

export async function getTemperature() {
  return await invoke("get_device_temperature");
}

export async function getVoltage() {
  return await invoke("get_device_voltage");
}

export async function getAnalog() {
  return await invoke("get_device_analog");
}

export async function getDigital() {
  return await invoke("get_device_digital");
}
