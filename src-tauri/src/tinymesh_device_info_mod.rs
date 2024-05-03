//! This module contains functions for getting information about the connected TinyMesh device.
//! These functions are used in the Tauri frontend's device info tab.

use crate::data_types::DeviceEntity;
use crate::tinymesh_config_mod::get_device_config_from_device;
use crate::tinymesh_serial_util::{
    clear_output_buffer_of_device, read_bytes_till_3e_from_device_to_buffer, send_bytes_to_device,
};
use log::info;
use serialport::SerialPort;
use tauri::{AppHandle, Manager, State};

/// This function gets the RSSI value from the connected serial device for the current channel.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A string containing the RSSI value in dBm or an error message if the RSSI value could not be read.
#[tauri::command]
pub fn get_device_rssi(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> String {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            clear_output_buffer_of_device(device);
            if let Ok(result) = get_rssi_from_device(device, &app_handle) {
                return format!(
                    "RSSI: -{} dBm, DEC: {}",
                    ((result as f64) * 0.5) as f64,
                    result
                );
            }
        }
    }
    return "RSSI: [UNABLE TO READ]".to_string();
}

/// This function gets the analog pins from the connected serial device.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A string containing the analog pin values or an error message if the analog values could not be read.
#[tauri::command]
pub fn get_device_analog(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> String {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            clear_output_buffer_of_device(device);
            if let Ok(analog) = get_analog_from_device(device, &app_handle) {
                let result_str = analog
                    .iter()
                    .map(|byte| format!("{:02X}", byte))
                    .collect::<Vec<String>>()
                    .join(" ");
                return format!("Analog: [{}]", result_str);
            }
        }
    }
    return "Analog: [UNABLE TO READ]".to_string();
}

/// This function gets the digital pins from the connected serial device.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A string containing the digital pin values or an error message if the digital values could not be read.
#[tauri::command]
pub fn get_device_digital(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> String {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            clear_output_buffer_of_device(device);
            if let Ok(digital) = get_digital_from_device(device, &app_handle) {
                return format!("Digital: {:02X}", digital);
            }
        }
    }
    return "Digital: [UNABLE TO READ]".to_string();
}

/// This function gets the temperature from the connected serial device.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A string containing the temperature value or an error message if the temperature value could not be read.
#[tauri::command]
pub fn get_device_temperature(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> String {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            clear_output_buffer_of_device(device);
            if let Ok(temperature_dec) = get_temperature_from_device(device, &app_handle) {
                return format!("Temperature: {} \u{00B0}C", (temperature_dec as i32) - 128);
            }
        }
    }
    return "Temperature: [UNABLE TO READ]".to_string();
}

/// This function gets the power supply voltage from the connected serial device.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A string containing the voltage value or an error message if the voltage value could not be read.
#[tauri::command]
pub fn get_device_voltage(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> String {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            clear_output_buffer_of_device(device);
            if let Ok(voltage) = get_voltage_from_device(device, &app_handle) {
                return format!("Voltage: {:.2} V", (voltage as f64) * 0.030);
            }
        }
    }
    return "Voltage: [UNABLE TO READ]".to_string();
}

fn get_rssi_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<u8, String> {
    let mut buffer = vec![];
    let send_result = send_bytes_to_device(device, &[b'S'], app_handle);
    if send_result {
        read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, app_handle);
        if buffer.len() == 1 {
            return Ok(buffer[0]);
        }
    }
    return Err("RSSI: Bad".to_string());
}

fn get_analog_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<Vec<u8>, String> {
    let mut buffer = vec![];
    let send_result = send_bytes_to_device(device, &[b'A'], app_handle);
    if send_result {
        read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, app_handle);
        if buffer.len() > 1 {
            return Ok(buffer);
        }
    }
    return Err("Analog: [UNABLE TO READ]".to_string());
}

fn get_digital_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<u8, String> {
    let mut buffer = vec![];
    let send_result = send_bytes_to_device(device, &[b'D'], app_handle);
    if send_result {
        read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, app_handle);
        if buffer.len() == 1 {
            return Ok(buffer[0]);
        }
    }
    return Err("Digital: [UNABLE TO READ]".to_string());
}

fn get_temperature_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<u8, String> {
    let mut buffer = vec![];
    let send_result = send_bytes_to_device(device, &[b'U'], app_handle);
    if send_result {
        read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, app_handle);
        if buffer.len() == 1 {
            return Ok(buffer[0]);
        }
    }
    return Err("Temperature: [UNABLE TO READ]".to_string());
}

fn get_voltage_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<u8, String> {
    let mut buffer = vec![];
    let send_result = send_bytes_to_device(device, &[b'V'], app_handle);
    if send_result {
        read_bytes_till_3e_from_device_to_buffer(device, &mut buffer, app_handle);
        if buffer.len() == 1 {
            return Ok(buffer[0]);
        }
    }
    return Err("Voltage: [UNABLE TO READ]".to_string());
}

/// This struct contains the data that is emitted as a tauri event in Spectrum Analyzer mode
#[derive(Clone, serde::Serialize)]
pub struct RSSIEvent {
    pub rssi: f64,
    pub channel: u8,
}

/// This function starts the RSSI stream background process and adds the running task to the `rssi_task` state variable.
/// It will also set the `is_rssi_task_running` flag.
/// It starts an infinite loop that will circle through all the channels, and read their RSSI.
/// It will emit an event for each RSSI value that is read.
///
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
#[tauri::command]
pub fn start_rssi_stream(device_entity: State<DeviceEntity>, app_handle: AppHandle) {
    // info!("Starting RSSI stream");
    let device_port = device_entity.port.clone();
    let device_port_2 = device_entity.port.clone();
    if let Ok(mut is_rssi_task_running) = device_entity.is_rssi_task_running.lock() {
        if !*is_rssi_task_running {
            *is_rssi_task_running = true;
        } else {
            return;
        }
    }
    let is_rssi_task_running = device_entity.is_rssi_task_running.clone();
    let (mut min_channel, mut max_channel) = (0, 0);
    if let Ok(mut device_config) = device_entity.device_config.lock() {
        if let Some(device_config) = device_config.as_ref() {
            if let Some(channel) = device_config
                .cells
                .iter()
                .find(|cell| cell.name == "RF Channel")
            {
                min_channel = channel.min_value as u8;
                max_channel = channel.max_value as u8;
            }
        } else {
            if let Ok(mut device) = device_port_2.lock() {
                if let Some(device) = device.as_mut() {
                    if let Ok(device_config_from_call) =
                        get_device_config_from_device(device, &app_handle)
                    {
                        *device_config = Some(device_config_from_call.clone());
                        if let Some(channel) = device_config_from_call
                            .cells
                            .iter()
                            .find(|cell| cell.name == "RF Channel")
                        {
                            min_channel = channel.min_value as u8;
                            max_channel = channel.max_value as u8;
                        }
                    }
                }
            }
        }
    }

    let stream = tauri::async_runtime::spawn(async move {
        if let Ok(mut device) = device_port.lock() {
            if let Some(mut device) = device.as_mut() {
                loop {
                    if let Ok(is_rssi_task_running) = is_rssi_task_running.lock() {
                        if !*is_rssi_task_running {
                            info!("Stopping RSSI stream");
                            return;
                        }
                    }

                    for i in min_channel..=max_channel {
                        if let Ok(is_rssi_task_running) = is_rssi_task_running.lock() {
                            if !*is_rssi_task_running {
                                info!("Stopping RSSI stream");
                                return;
                            }
                        }
                        clear_output_buffer_of_device(&mut device);
                        let channel_switch_success = switch_to_channel(i, &mut device, &app_handle);
                        if channel_switch_success {
                            if let Ok(rssi) = get_rssi_from_device(&mut device, &app_handle) {
                                app_handle
                                    .emit_all(
                                        "rssi_event",
                                        RSSIEvent {
                                            rssi: -(rssi as f64) / 2.0,
                                            channel: i,
                                        },
                                    )
                                    .unwrap();
                            }
                        }
                    }
                }
            }
        }
    });
    if let Ok(mut rssi_task) = device_entity.rssi_task.lock() {
        *rssi_task = Some(stream);
    }
}

/// This function stops the RSSI stream background process and removes the running task from the `rssi_task` state variable.
/// It will also set the `is_rssi_task_running` flag to false.
///
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
#[tauri::command]
pub fn stop_rssi_stream(device_entity: State<DeviceEntity>) {
    info!("Sending signal to stop RSSI stream");
    if let (Ok(mut rssi_task), Ok(mut is_rssi_task_running)) = (
        device_entity.rssi_task.lock(),
        device_entity.is_rssi_task_running.lock(),
    ) {
        if let Some(rssi_task) = rssi_task.as_mut() {
            *is_rssi_task_running = false;
            rssi_task.abort();
        }
        *rssi_task = None;
    }
}

fn switch_to_channel(
    channel: u8,
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> bool {
    let mut read_bytes_result = vec![];
    let send_bytes_result = send_bytes_to_device(device, &[b'C'], app_handle);
    read_bytes_till_3e_from_device_to_buffer(device, &mut read_bytes_result, app_handle);
    if send_bytes_result && read_bytes_result.len() == 0 {
        let mut read_bytes_result2 = vec![];
        let send_bytes_result2 = send_bytes_to_device(device, &[channel], app_handle);
        read_bytes_till_3e_from_device_to_buffer(device, &mut read_bytes_result2, app_handle);
        return send_bytes_result2 && read_bytes_result2.len() == 0;
    }
    return false;
}
