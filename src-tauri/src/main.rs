// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use serialport;
use serialport::SerialPort;
use tauri::State;
use tinymesh_cc_tool::input_processing;
use std::sync::Mutex;
use std::time::Duration;


// create a DeviceEntity struct to hold SerialPort connection that can be shared across threads
struct DeviceEntity(Mutex<Option<Box<dyn SerialPort>>>);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_devices() -> Vec<String> {
    println!("Message from Rust!");
    let ports = serialport::available_ports();
    if let Ok(ports) = ports {
        return ports.iter().map(|port| port.port_name.clone()).collect();
    }
    return vec![];
}

#[tauri::command]
fn connect_to_device(device_name: &str, baud_rate: u32, device_entity: State<DeviceEntity>) -> bool {
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
fn disconnect_from_device(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.0.lock() {
        println!("Disconnecting from device");
        *device = None;
        return true;
    }
    return false;
}

#[tauri::command]
fn send_bytes(input: String, device_entity: State<DeviceEntity>) -> bool {
    let bytes_to_send: Vec<u8> = input_processing::process_input(&input).unwrap_or(vec![]);
    println!("Sending bytes: {:?}", bytes_to_send);
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            if let Ok(()) = device.write_all(&bytes_to_send) {
                device.flush().unwrap_or_else(|e| println!("Error flushing: {}", e));
                return true;
            }
        }
    }
    return false;
}

#[tauri::command]
fn read_bytes(device_entity: State<DeviceEntity>) -> Vec<u8> {
    let mut result = vec![];
    if let Ok(mut device) = device_entity.0.lock() {
        if let Some(device) = device.as_mut() {
            device.clear(serialport::ClearBuffer::Output).unwrap_or_else(|e| println!("Error clearing: {}", e));
            if let Ok(num_bytes_read) = device.read_to_end(&mut result) {
                if num_bytes_read == result.len() {
                    return result;
                } else {
                    return result[0..num_bytes_read].to_vec();
                }
            }
        }
    }
    return result;
}

fn main() {
    tauri::Builder::default()
        .manage(DeviceEntity(Default::default()))
        .invoke_handler(
            tauri::generate_handler![greet, get_devices, connect_to_device, disconnect_from_device, send_bytes, read_bytes]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
