//! This module contains functions related to getting and setting the device calibration.
//! These functions are used by the Tauri frontend's calibration tab.

use crate::data_types::{DeviceEntity, MkDeviceCell, MkDeviceCalib};
use crate::device_calibration_parser::parse_device_calib;
use crate::device_config_parser::parse_device_config;
use crate::tinymesh_serial_util::{
    clear_output_buffer_of_device,
    read_bytes_till_3e_from_device_to_buffer, send_bytes_to_device,
};
use serialport::SerialPort;
use tauri::{AppHandle, State};

/// This function gets the device calibration from the connected serial device.
/// It will read the calibration from the device, match it with corresponding module description RMD file
/// and return it as a `MkDeviceCalib` struct.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A `MkDeviceCalib` struct containing the device calibration if the calibration was successfully retrieved and matched.
/// Returns an error if the calibration could not be retrieved or matched.
#[tauri::command]
pub fn get_device_calib(
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> Result<MkDeviceCalib, String> {
    let mut device = device_entity.port.lock().map_err(|err| err.to_string())?;
    let device = device
        .as_mut()
        .ok_or("Could not lock the selected device".to_string())?;
    let device_calib = get_device_calib_from_device(device, &app_handle)?;

    let mut device_calib_from_state = device_entity
        .device_calib
        .lock()
        .map_err(|err| err.to_string())?;
    let cloned_config = device_calib.clone();
    *device_calib_from_state = Some(cloned_config);

    // info!("\ntinymesh_calibration_mod::get_device_calib---> device_calib = {:?}\n", device_calib);
    return Ok(device_calib);
}


pub fn get_device_calib_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<MkDeviceCalib, String> {
    // info!("\ntinymesh_calibration_mod::get_device_calib_from_device(device, app_handle)\n");

    let mut config_bytes_buffer = vec![];
    if clear_output_buffer_of_device(device) && send_bytes_to_device(device, &[0x30], &app_handle) {
        // info!("\nCALIB_DEVICE ==== {:?}\n", device);

        read_bytes_till_3e_from_device_to_buffer(device, &mut config_bytes_buffer, &app_handle);
        // info!("\ntinymesh_calibration_mod::get_device_calib_from_device---> config_bytes_buffer = {:?}\n", config_bytes_buffer);

        let device_config_info = parse_device_config(&config_bytes_buffer, None, Some(&app_handle))?;
        let model = device_config_info.model;

        config_bytes_buffer = vec![];
        if clear_output_buffer_of_device(device) && send_bytes_to_device(device, &[0x72], &app_handle) {
            // info!("\nCALIB_DEVICE 2 ==== {:?}\n", device);
    
            read_bytes_till_3e_from_device_to_buffer(device, &mut config_bytes_buffer, &app_handle);
            // info!("\ntinymesh_calibration_mod::get_device_calib_from_device---> config_bytes_buffer = {:?}\n", config_bytes_buffer);
    
            let device_calib = parse_device_calib(&config_bytes_buffer, model, None, Some(&app_handle))?;
    
            // info!("\ntinymesh_calibration_mod::get_device_calib_from_device---> device_calib = {:?}\n", device_calib);
            return Ok(device_calib);
        }

        // info!("\ntinymesh_calibration_mod::get_device_calib_from_device---> device_calib = {:?}\n", device_calib);
        return Err("Unable to get calibration. Model not found.".to_string());
    }
    return Err("Unable to get calibration. Looks like sending bytes failed.".to_string());
}

/// This function sets the device calibration in the connected serial device.
/// **NOTE**: This doesn't update the device calibration in the state of the program.
/// It only sends the new calibration to the device.
/// # Arguments
/// * `cells` - A vector of `MkDeviceCell` structs containing the new device calibration
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the device calibration was set successfully.
#[tauri::command]
pub fn set_device_calib(
    cells: Vec<MkDeviceCell>,
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            if clear_output_buffer_of_device(device) {
                let mut bytes_to_send = vec![];
                if let Ok(device_calib_optional) = device_entity.device_calib.lock() {
                    if let Some(device_calib) = &*device_calib_optional {
                        bytes_to_send = get_bytes_to_send_for_calib_change(device_calib, &cells);
                    }
                }
                if bytes_to_send.is_empty() {
                    return false;
                }
                let send_result = send_bytes_to_device(device, &[b'H', b'W'], &app_handle);
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
// #[tauri::command]
// pub fn factory_reset_calib(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> bool {
//     if let Ok(mut device) = device_entity.port.lock() {
//         if let Some(device) = device.as_mut() {
//             clear_output_buffer_of_device(device);
//             let send_result = send_bytes_to_device(device, &[b'@', b'T', b'M'], &app_handle);
//             if send_result {
//                 let mut buffer = vec![];
//                 read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, &app_handle);
//                 return buffer.len() == 0;
//             }
//         }
//     }
//     return false;
// }

fn get_bytes_to_send_for_calib_change(
    device_calib: &MkDeviceCalib,
    cells: &[MkDeviceCell],
) -> Vec<u8> {
    let mut bytes_to_send = vec![];
    for (index, cell) in cells.iter().enumerate() {
        if cell.current_value != device_calib.calibration_cells[index].current_value {
            bytes_to_send.push(cell.address as u8);
            bytes_to_send.push(cell.current_value);
        }
    }
    if bytes_to_send.len() > 0 {
        bytes_to_send.push(0xff);
    }
    return bytes_to_send;
}

