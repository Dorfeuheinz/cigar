use crate::device_config_parser::{parse_device_config, MkDeviceConfig};
use crate::input_processing;
use serialport;
use serialport::SerialPort;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, State};

// create a DeviceEntity struct to hold SerialPort connection that can be shared across threads
pub struct DeviceEntity(pub Mutex<Option<Box<dyn SerialPort>>>);

#[derive(Clone, serde::Serialize)]
struct Payload {
    pub data_type: String,
    pub data: String,
}

#[tauri::command]
pub fn get_devices() -> Vec<String> {
    println!("Getting available devices");
    let ports = serialport::available_ports();
    if let Ok(ports) = ports {
        return ports.iter().map(|port| port.port_name.clone()).collect();
    }
    return vec![];
}

#[tauri::command]
pub fn get_connected_device(device_entity: State<DeviceEntity>) -> Option<String> {
    println!("Getting connected device");
    if let Ok(device) = device_entity.0.lock() {
        if let Some(device) = device.as_ref() {
            println!("Connected device: {}", device.name().unwrap_or_default());
            return device.name();
        }
    }
    return None;
}

#[tauri::command]
pub fn connect_to_device(
    device_name: &str,
    baud_rate: u32,
    device_entity: State<DeviceEntity>,
) -> bool {
    println!("Connecting to {} with baud rate {}", device_name, baud_rate);
    let port = serialport::new(device_name, baud_rate)
        .data_bits(serialport::DataBits::Eight)
        .timeout(Duration::from_millis(500))
        .open();
    if let (Ok(mut device), Ok(open_port)) = (device_entity.0.lock(), port) {
        *device = Some(open_port);
        return true;
    }
    return false;
}

#[tauri::command]
pub fn disconnect_from_device(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.0.lock() {
        println!("Disconnecting from device");
        *device = None;
        return true;
    }
    return false;
}

#[tauri::command]
pub fn send_bytes(
    input: String,
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> bool {
    let bytes_to_send: Vec<u8> = input_processing::process_input(&input).unwrap_or(vec![]);
    println!("Sending bytes: {:?}", bytes_to_send);
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            let send_result = send_bytes_to_device(device, &bytes_to_send, &app_handle);
            return send_result;
        }
    }
    return false;
}

#[tauri::command]
pub fn clear_buffer(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            return clear_output_buffer_of_device(device);
        }
    }
    return false;
}

#[tauri::command]
pub fn read_bytes(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> Vec<u8> {
    let mut result = vec![];
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            read_bytes_from_device_to_buffer(device, &mut result, &app_handle);
            return result;
        }
    }
    return result;
}

#[tauri::command]
pub fn get_device_config(
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> Result<MkDeviceConfig, String> {
    let mut config_bytes_buffer = vec![];

    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            if clear_output_buffer_of_device(device)
                && send_bytes_to_device(device, &[0x30], &app_handle)
            {
                read_bytes_from_device_to_buffer(device, &mut config_bytes_buffer, &app_handle);
                return parse_device_config(&config_bytes_buffer, None);
            }
        }
    }
    return Err("Unable to get config".to_string());
}

fn clear_output_buffer_of_device(device: &mut Box<dyn SerialPort>) -> bool {
    return match device.clear(serialport::ClearBuffer::Output) {
        Ok(()) => true,
        Err(_) => false,
    };
}

fn send_bytes_to_device(
    device: &mut Box<dyn SerialPort>,
    bytes_to_send: &[u8],
    app_handle: &AppHandle,
) -> bool {
    return match device.write_all(bytes_to_send) {
        Ok(()) => {
            device
                .flush()
                .unwrap_or_else(|e| println!("Error flushing: {}", e));
            let bytes_to_send_str = bytes_to_send
                .iter()
                .map(|b| format!("{:02X}", b))
                .collect::<Vec<String>>()
                .join(" ");
            app_handle
                .emit_all(
                    "exchange_bytes_event",
                    Payload {
                        data_type: "TX".to_string(),
                        data: bytes_to_send_str,
                    },
                )
                .unwrap_or_else(|e| println!("Error emitting: {}", e));
            true
        }
        Err(_) => false,
    };
}

fn read_bytes_from_device_to_buffer(
    device: &mut Box<dyn SerialPort>,
    buffer: &mut Vec<u8>,
    app_handle: &AppHandle,
) -> usize {
    let result = device.read_to_end(buffer).unwrap_or_else(|e| {
        println!("Error reading: {}", e);
        0
    });
    if buffer.len() > 0 {
        let bytes_to_read_str = buffer
            .iter()
            .map(|b| format!("{:02X}", b))
            .collect::<Vec<String>>()
            .join(" ");
        app_handle
            .emit_all(
                "exchange_bytes_event",
                Payload {
                    data_type: "RX".to_string(),
                    data: bytes_to_read_str,
                },
            )
            .unwrap_or_else(|e| println!("Error emitting: {}", e));
    }
    result
}
