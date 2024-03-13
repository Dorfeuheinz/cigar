use crate::device_config_parser::{parse_device_config, MkDeviceConfig};
use crate::input_processing;
use serialport;
use serialport::SerialPort;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Manager, State};

// create a DeviceEntity struct to hold SerialPort connection that can be shared across threads
pub struct DeviceEntity {
    pub port: Arc<Mutex<Option<Box<dyn SerialPort>>>>,
    pub rssi_task: Mutex<Option<tauri::async_runtime::JoinHandle<()>>>,
    pub is_rssi_task_running: Arc<Mutex<bool>>,
}

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
    if let Ok(device) = device_entity.port.lock() {
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
        .timeout(Duration::from_millis(30))
        .open();
    if let (Ok(mut device), Ok(open_port)) = (device_entity.port.lock(), port) {
        *device = Some(open_port);
        return true;
    }
    return false;
}

#[tauri::command]
pub fn disconnect_from_device(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
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
    let bytes_to_send: Vec<u8> = input_processing::process_input(&input).unwrap_or_else(|e| {
        println!("Error processing input: {:#?}", e);
        vec![]
    });
    println!("Sending bytes: {:?}", bytes_to_send);
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            let send_result = send_bytes_to_device(device, &bytes_to_send, &app_handle);
            return send_result;
        }
    }
    return false;
}

#[tauri::command]
pub fn clear_buffer(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            return clear_output_buffer_of_device(device);
        }
    }
    return false;
}

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

#[tauri::command]
pub fn get_device_config(
    device_entity: State<DeviceEntity>,
    app_handle: AppHandle,
) -> Result<MkDeviceConfig, String> {
    let mut config_bytes_buffer = vec![];

    if let Ok(mut device) = device_entity.port.lock() {
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
    return "RSSI: Bad".to_string();
}

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
                read_bytes_from_device_to_buffer(device, &mut recv_buffer, &app_handle);
                if send_result && recv_buffer == recv_seq {
                    return true;
                }
            }
        }
    }
    return false;
}

#[derive(Clone, serde::Serialize)]
pub struct RSSIEvent {
    pub rssi: f64,
    pub channel: u8,
}

#[tauri::command]
pub fn start_rssi_stream(device_entity: State<DeviceEntity>, app_handle: AppHandle) {
    println!("Starting RSSI stream");
    let device_port = device_entity.port.clone();
    if let Ok(mut is_rssi_task_running) = device_entity.is_rssi_task_running.lock() {
        *is_rssi_task_running = true;
    }
    let is_rssi_task_running = device_entity.is_rssi_task_running.clone();
    let stream = tauri::async_runtime::spawn(async move {
        if let Ok(mut device) = device_port.lock() {
            if let Some(mut device) = device.as_mut() {
                loop {
                    if let Ok(is_rssi_task_running) = is_rssi_task_running.lock() {
                        if !*is_rssi_task_running {
                            println!("Stopping RSSI stream 1");
                            return;
                        }
                    }
                    for i in 1..=10 {
                        if let Ok(is_rssi_task_running) = is_rssi_task_running.lock() {
                            if !*is_rssi_task_running {
                                println!("Stopping RSSI stream 2");
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

#[tauri::command]
pub fn stop_rssi_stream(device_entity: State<DeviceEntity>) {
    println!("Stopping RSSI stream");
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
    read_bytes_from_device_to_buffer(device, &mut read_bytes_result, app_handle);
    if send_bytes_result && read_bytes_result.len() > 0 && read_bytes_result[0] == 0x3e {
        let mut read_bytes_result2 = vec![];
        let send_bytes_result2 = send_bytes_to_device(device, &[channel], app_handle);
        read_bytes_from_device_to_buffer(device, &mut read_bytes_result2, app_handle);
        return send_bytes_result2 && read_bytes_result2.len() > 0 && read_bytes_result2[0] == 0x3e;
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

fn get_rssi_from_device(
    device: &mut Box<dyn SerialPort>,
    app_handle: &AppHandle,
) -> Result<u8, String> {
    let mut buffer = vec![];
    let send_result = send_bytes_to_device(device, &[b'S'], app_handle);
    if send_result {
        read_bytes_from_device_to_buffer(device, &mut buffer, app_handle);
        if let [rssi_dec, 0x3e] = &buffer[..] {
            return Ok(*rssi_dec);
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
        read_bytes_from_device_to_buffer(device, &mut buffer, app_handle);
        if buffer.len() > 1 && buffer.ends_with(&[0x3e]) {
            return Ok(buffer[..buffer.len() - 1].to_vec());
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
        read_bytes_from_device_to_buffer(device, &mut buffer, app_handle);
        if let [digital_dec, 0x3e] = &buffer[..] {
            return Ok(*digital_dec);
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
        read_bytes_from_device_to_buffer(device, &mut buffer, app_handle);
        if let [temp_dec, 0x3e] = &buffer[..] {
            return Ok(*temp_dec);
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
        read_bytes_from_device_to_buffer(device, &mut buffer, app_handle);
        if let [voltage_dec, 0x3e] = &buffer[..] {
            return Ok(*voltage_dec);
        }
    }
    return Err("Voltage: [UNABLE TO READ]".to_string());
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
