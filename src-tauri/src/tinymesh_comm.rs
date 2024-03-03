use serialport;
use serialport::SerialPort;
use tauri::{AppHandle, Manager, State};
use crate::input_processing;
use std::sync::Mutex;
use std::time::Duration;

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
pub fn connect_to_device(device_name: &str, baud_rate: u32, device_entity: State<DeviceEntity>) -> bool {
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
pub fn send_bytes(input: String, device_entity: State<DeviceEntity>, app_handle: AppHandle) -> bool {
    let bytes_to_send: Vec<u8> = input_processing::process_input(&input).unwrap_or(vec![]);
    println!("Sending bytes: {:?}", bytes_to_send);
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            if let Ok(()) = device.write_all(&bytes_to_send) {
                device.flush().unwrap_or_else(|e| println!("Error flushing: {}", e));
                // convert bytes to send to a space-delimited string. each byte should be represented in hex
                let bytes_to_send_str = bytes_to_send.iter().map(|b| format!("{:02X}", b)).collect::<Vec<String>>().join(" ");
                app_handle.emit_all("exchange_bytes_event", Payload { data_type: "TX".to_string(), data: bytes_to_send_str }).unwrap_or_else(|e| println!("Error emitting: {}", e));
                return true;
            }
        }
    }
    return false;
}

#[tauri::command]
pub fn clear_buffer(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            return match device.clear(serialport::ClearBuffer::Input) {
                Ok(()) => true,
                Err(_) => false,
            }
        }
    }
    return false;
}

#[tauri::command]
pub fn read_bytes(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> Vec<u8> {
    let mut result = vec![];
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            let _ = device.read_to_end(&mut result).unwrap_or_else(|e| {
                println!("Error reading: {}", e);
                0
            });
            println!("Read bytes: {:?}", result);
            if result.len() > 0 {
                let bytes_to_read_str = result.iter().map(|b| format!("{:02X}", b)).collect::<Vec<String>>().join(" ");
                app_handle.emit_all("exchange_bytes_event", Payload { data_type: "RX".to_string(), data: bytes_to_read_str }).unwrap_or_else(|e| println!("Error emitting: {}", e));
            }
            return result;
        }
    }
    return result;
}