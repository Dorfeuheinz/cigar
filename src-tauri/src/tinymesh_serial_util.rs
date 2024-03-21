//! This module contains functions for interacting with the serial port.
//! These functions are called by the Tauri frontend to communicate with the serial port.

use crate::data_types::{DeviceEntity, EventPayload};
use crate::input_processing::process_input;
use log::{error, info};
use serialport::SerialPort;
use std::time::Duration;
use tauri::{AppHandle, Manager, State};

/// This function resets the state of the program.
/// It is called when a new connection is being made or when the device is disconnected.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
///
/// # Returns
/// An `Ok(())` if the program state was reset successfully, or an error if the program state could not be reset.
#[tauri::command]
pub fn reset_program_state(device_entity: State<DeviceEntity>) -> Result<(), String> {
    info!("Resetting program state");
    *device_entity.port.lock().map_err(|err| err.to_string())? = None;
    *device_entity
        .is_rssi_task_running
        .lock()
        .map_err(|err| err.to_string())? = false;
    *device_entity
        .is_communication_task_running
        .lock()
        .map_err(|err| err.to_string())? = false;
    *device_entity
        .device_config
        .lock()
        .map_err(|err| err.to_string())? = None;
    *device_entity
        .rssi_task
        .lock()
        .map_err(|err| err.to_string())? = None;
    *device_entity
        .communication_task
        .lock()
        .map_err(|err| err.to_string())? = None;
    Ok(())
}

/// This function returns a list of available serial ports on the system.
///
/// # Returns
/// A vector of strings containing the names of the available serial ports.
#[tauri::command]
pub fn get_devices() -> Vec<String> {
    info!("Getting available devices");
    let ports = serialport::available_ports();
    if let Ok(ports) = ports {
        return ports.iter().map(|port| port.port_name.clone()).collect();
    }
    return vec![];
}

/// This function returns the serial port name of the connected device.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
///
/// # Returns
/// An optional string containing the serial port name of the connected device.
/// If no device is connected, it returns None.
#[tauri::command]
pub fn get_connected_device(device_entity: State<DeviceEntity>) -> Option<String> {
    info!("Getting connected device");
    if let Ok(device) = device_entity.port.lock() {
        if let Some(device) = device.as_ref() {
            info!("Connected device: {}", device.name().unwrap_or_default());
            return device.name();
        }
    }
    return None;
}

/// This function connects to the specified serial port with the specified baud rate.
/// # Arguments
/// * `device_name` - The name of the serial port to connect to.
/// * `baud_rate` - The baud rate to use when connecting to the serial port.
/// * `device_entity` - The state of the program (provided by Tauri)
///
/// # Returns
/// An `Ok(())` if the connection was successful, or an error if the connection failed.
#[tauri::command]
pub fn connect_to_device(
    device_name: &str,
    baud_rate: u32,
    device_entity: State<DeviceEntity>,
) -> Result<(), String> {
    info!("Connecting to {} with baud rate {}", device_name, baud_rate);
    let port = serialport::new(device_name, baud_rate)
        .data_bits(serialport::DataBits::Eight)
        .timeout(Duration::from_millis(10))
        .open();
    let mut device = device_entity.port.lock().map_err(|err| err.to_string())?;
    let open_port = port.map_err(|err| err.to_string())?;
    *device = Some(open_port);
    return Ok(());
}

/// This function disconnects from the connected serial port.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the disconnect was successful or not.
#[tauri::command]
pub fn disconnect_from_device(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        info!("Disconnecting from device");
        *device = None;
        return true;
    }
    return false;
}

/// This function sends bytes to the connected serial port and emits an event if the bytes were successfully sent.
/// # Arguments
/// * `input` - The bytes to send to the serial port
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the bytes were successfully sent.
#[tauri::command]
pub fn send_bytes(
    input: String,
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> bool {
    let bytes_to_send: Vec<u8> = process_input(&input).unwrap_or_else(|e| {
        error!("Error processing input: {:#?}", e);
        vec![]
    });
    info!("Sending bytes: {:?}", bytes_to_send);
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            let send_result = send_bytes_to_device(device, &bytes_to_send, &app_handle);
            return send_result;
        }
    }
    return false;
}

/// This function clears the output buffer of the connected serial device.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the output buffer was cleared successfully.
#[tauri::command]
pub fn clear_buffer(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            return clear_output_buffer_of_device(device);
        }
    }
    return false;
}

/// This function reads bytes from the connected serial device and returns them as a vector of bytes.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A vector of bytes containing the read bytes from the serial device.
#[tauri::command]
pub fn read_bytes(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> Vec<u8> {
    let mut result = vec![];
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            read_bytes_from_device_to_buffer(device, &mut result, &app_handle);
            return result;
        }
    }
    return result;
}

pub fn clear_output_buffer_of_device(device: &mut Box<dyn SerialPort>) -> bool {
    return match device.clear(serialport::ClearBuffer::Output) {
        Ok(()) => true,
        Err(_) => false,
    };
}

pub fn send_bytes_to_device(
    device: &mut Box<dyn SerialPort>,
    bytes_to_send: &[u8],
    app_handle: &AppHandle,
) -> bool {
    return match device.write_all(bytes_to_send) {
        Ok(()) => {
            device
                .flush()
                .unwrap_or_else(|e| error!("Error flushing: {}", e));
            app_handle
                .emit_all(
                    "exchange_bytes_event",
                    EventPayload {
                        data_type: "TX".to_string(),
                        data: bytes_to_send.to_vec(),
                    },
                )
                .unwrap_or_else(|e| error!("Error emitting: {}", e));
            true
        }
        Err(_) => false,
    };
}

pub fn read_bytes_till_3e_from_device_to_buffer(
    device: &mut Box<dyn SerialPort>,
    buffer: &mut Vec<u8>,
    app_handle: &AppHandle,
) -> usize {
    // read into buf until we see 0x3e
    let mut count = 0;
    let mut temp_buf = [0u8; 1];
    while buffer.len() == 0 || buffer[buffer.len() - 1] != 0x3e {
        match device.read_exact(&mut temp_buf) {
            Ok(_) => {
                if temp_buf[0] == b'>' {
                    break;
                } else {
                    buffer.push(temp_buf[0]);
                }
                count += 1;
            }
            Err(_) => continue,
        }
    }
    app_handle
        .emit_all(
            "exchange_bytes_event",
            EventPayload {
                data_type: "RX".to_string(),
                data: [buffer.to_vec(), vec![0x3e]].concat(),
            },
        )
        .unwrap_or_else(|e| error!("Error emitting: {}", e));
    count
}

pub fn read_bytes_from_device_to_buffer(
    device: &mut Box<dyn SerialPort>,
    buffer: &mut Vec<u8>,
    app_handle: &AppHandle,
) -> usize {
    let result = device.read_to_end(buffer).unwrap_or(0);
    if buffer.len() > 0 {
        app_handle
            .emit_all(
                "exchange_bytes_event",
                EventPayload {
                    data_type: "RX".to_string(),
                    data: buffer.to_vec(),
                },
            )
            .unwrap_or_else(|e| error!("Error emitting: {}", e));
    }
    result
}
