import { invoke } from "@tauri-apps/api";
import { MkDeviceConfig, MkDeviceCell, MkDeviceCalib} from "../DataTypes";

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

export async function getDeviceConfig() {
  let result: MkDeviceConfig = await invoke("get_device_config");

  return result;
}

export async function getDeviceCalib() {
  let result: MkDeviceCalib = await invoke("get_device_calib");
  return result;
}

export async function setDeviceConfig(cells: MkDeviceCell[]) {
  let result: boolean = await invoke("set_device_config", { cells: cells });
  return result;
}

export async function setDeviceCalib(cells: MkDeviceCell[]) {
  let result: boolean = await invoke("set_device_calib", { cells: cells });
  return result;
}
