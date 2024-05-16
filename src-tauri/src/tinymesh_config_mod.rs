//! This module contains functions related to getting and setting the device configuration.
//! These functions are used by the Tauri frontend's configuration tab.

use crate::data_types::{DeviceEntity, MkDeviceCell, MkDeviceConfig};
use crate::device_config_parser::parse_device_config;
use crate::tinymesh_serial_util::{
    clear_output_buffer_of_device, read_bytes_from_device_to_buffer,
    read_bytes_till_3e_from_device_to_buffer, send_bytes_to_device,
};
use serialport::SerialPort;
use tauri::{AppHandle, State};

/// This function gets the device configuration from the connected serial device.
/// It will read the configuration from the device, match it with corresponding module description RMD file
/// and return it as a `MkDeviceConfig` struct.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A `MkDeviceConfig` struct containing the device configuration if the configuration was successfully retrieved and matched.
/// Returns an error if the configuration could not be retrieved or matched.
#[tauri::command]
pub fn get_device_config(
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> Result<MkDeviceConfig, String> {
    let mut device = device_entity.port.lock().map_err(|err| err.to_string())?;
    let device = device
        .as_mut()
        .ok_or("Could not lock the selected device".to_string())?;
    let device_config = get_device_config_from_device(device, &app_handle)?;

    let mut device_config_from_state = device_entity
        .device_config
        .lock()
        .map_err(|err| err.to_string())?;
    let cloned_config = device_config.clone();
    *device_config_from_state = Some(cloned_config);

    // info!("\ntinymesh_config_mod::get_device_config---> device_config = {:?}\n", device_config);
    return Ok(device_config);
}


pub fn get_device_config_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<MkDeviceConfig, String> {
    // info!("\nget_device_config_from_device::config_bytes_buffer(device, app_handle)\n");

    let mut config_bytes_buffer = vec![];
    if clear_output_buffer_of_device(device) && send_bytes_to_device(device, &[0x30], &app_handle) {
        // info!("\nCONFIG_DEVICE ==== {:?}\n", device);

        read_bytes_till_3e_from_device_to_buffer(device, &mut config_bytes_buffer, &app_handle);
        // info!("\nget_device_config_from_device::config_bytes_buffer, {:?}\n", config_bytes_buffer);

        let device_config = parse_device_config(&config_bytes_buffer, None, Some(&app_handle))?;
        // info!("\nget_device_config_from_device::device_config, {:?}\n", device_config);

        return Ok(device_config);
    }
    return Err("Unable to get config. Looks like sending bytes failed.".to_string());
}

/// This function sets the device configuration in the connected serial device.
/// **NOTE**: This doesn't update the device configuration in the state of the program.
/// It only sends the new configuration to the device.
/// # Arguments
/// * `cells` - A vector of `MkDeviceCell` structs containing the new device configuration
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the device configuration was set successfully.
#[tauri::command]
pub fn set_device_config(
    cells: Vec<MkDeviceCell>,
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            if clear_output_buffer_of_device(device) {
                let mut bytes_to_send = vec![];
                if let Ok(device_config_optional) = device_entity.device_config.lock() {
                    if let Some(device_config) = &*device_config_optional {
                        bytes_to_send = get_bytes_to_send_for_config_change(device_config, &cells);
                    }
                }
                if bytes_to_send.is_empty() {
                    return false;
                }
                let send_result = send_bytes_to_device(device, &[b'M'], &app_handle);
                if send_result {
                    let mut buffer = vec![];
                    read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, &app_handle);
                    clear_output_buffer_of_device(device);
                    if buffer.len() == 0 {
                        let send_changes_result =
                            send_bytes_to_device(device, &bytes_to_send, &app_handle);
                        if send_changes_result {
                            let mut buffer2 = vec![];
                            read_bytes_till_3e_from_device_to_buffer(
                                device,
                                &mut buffer2,
                                &app_handle,
                            );
                            return buffer2.len() == 0;
                        }
                    }
                }
            }
        }
    }
    return false;
}

/// This function sends a factory reset command to the connected serial device.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the factory reset command was successful.
#[tauri::command]
pub fn factory_reset(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            clear_output_buffer_of_device(device);
            let send_result = send_bytes_to_device(device, &[b'@', b'T', b'M'], &app_handle);

            if send_result {
                let mut buffer = vec![];
                read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, &app_handle);

                return buffer.len() == 0;
            }
        }
    }
    return false;
}

fn get_bytes_to_send_for_config_change(
    device_config: &MkDeviceConfig,
    cells: &[MkDeviceCell],
) -> Vec<u8> {
    let mut bytes_to_send = vec![];
    for (index, cell) in cells.iter().enumerate() {
        if cell.current_value != device_config.cells[index].current_value {
            bytes_to_send.push(cell.address as u8);
            bytes_to_send.push(cell.current_value);
        }
    }
    if bytes_to_send.len() > 0 {
        bytes_to_send.push(0xff);
    }
    return bytes_to_send;
}

/// This function executes a mode sequence on the connected serial device.
/// It will send the input bytes of the sequence to the device,
/// and match the device's output to the expected sequence.
/// For example: The sequence string: `aG #>` means that we should
/// send bytes `G` to the device and expect to receive `>`.
/// # Arguments
/// * `sequence_str` - The mode sequence to execute.
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A boolean indicating whether the mode sequence was executed successfully.
#[tauri::command]
pub fn execute_mode_sequence(
    sequence_str: String,
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> bool {
    let mut recv_buffer = vec![];
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            clear_output_buffer_of_device(device);
            if let Some((send_seq, recv_seq)) = extract_send_recv_seq(&sequence_str) {
                let send_result = send_bytes_to_device(device, &send_seq, &app_handle);
                if recv_seq.ends_with(&[b'>']) {
                    read_bytes_till_3e_from_device_to_buffer(device, &mut recv_buffer, &app_handle);
                    if send_result && recv_buffer == recv_seq[..recv_seq.len() - 1] {
                        return true;
                    }
                } else {
                    read_bytes_from_device_to_buffer(device, &mut recv_buffer, &app_handle);
                    if send_result && recv_buffer == recv_seq {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

fn extract_send_recv_seq(sequence_str: &str) -> Option<(Vec<u8>, Vec<u8>)> {
    if let [send_seq, recv_seq] = sequence_str
        .trim()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .as_slice()
    {
        let send = send_seq.trim_start_matches('a').as_bytes().to_vec();
        let recv = recv_seq.trim_start_matches('#').as_bytes().to_vec();
        return Some((send, recv));
    }
    None
}
