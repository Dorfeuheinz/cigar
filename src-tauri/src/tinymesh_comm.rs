use crate::device_config_parser::{parse_device_config, MkDeviceConfig};
use crate::input_processing;
use crate::mk_module_description::MkDeviceCell;
use log::{error, info};
use serialport::SerialPort;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::async_runtime::channel;
use tauri::{AppHandle, Manager, State};

pub struct DeviceEntity {
    // The device serial port connection that can be shared across threads
    pub port: Arc<Mutex<Option<Box<dyn SerialPort>>>>,

    // Tokio tasks for streaming RSSI in spectrum analyzer mode and background communication
    pub rssi_task: Mutex<Option<tauri::async_runtime::JoinHandle<()>>>,
    pub is_rssi_task_running: Arc<Mutex<bool>>,
    pub communication_task: Mutex<Option<tauri::async_runtime::JoinHandle<()>>>,
    pub is_communication_task_running: Arc<Mutex<bool>>,

    // pub background_reader_task: Mutex<Option<tauri::async_runtime::JoinHandle<()>>>,
    // pub reader_task_command: Arc<Mutex<ReaderCommand>>,

    // Device config
    pub device_config: Arc<Mutex<Option<MkDeviceConfig>>>,
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    pub data_type: String,
    pub data: Vec<u8>,
}

pub enum ReaderCommand {
    Stop,
    CollectBytes(),
    ClearBuffer,
}

#[tauri::command]
pub fn get_devices() -> Vec<String> {
    info!("Getting available devices");
    let ports = serialport::available_ports();
    if let Ok(ports) = ports {
        return ports.iter().map(|port| port.port_name.clone()).collect();
    }
    return vec![];
}

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

#[tauri::command]
pub fn connect_to_device(
    device_name: &str,
    baud_rate: u32,
    device_entity: State<DeviceEntity>,
) -> Result<(), String> {
    info!("Connecting to {} with baud rate {}", device_name, baud_rate);
    let port = serialport::new(device_name, baud_rate)
        .data_bits(serialport::DataBits::Eight)
        .timeout(Duration::from_millis(30))
        .open();
    let mut device = device_entity.port.lock().map_err(|err| err.to_string())?;
    let open_port = port.map_err(|err| err.to_string())?;
    *device = Some(open_port);
    return Ok(());
}

#[tauri::command]
pub fn disconnect_from_device(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        info!("Disconnecting from device");
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

#[tauri::command]
pub fn start_communication_task(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            if let Ok(mut cloned_device) = device.try_clone() {
                let is_communication_task_running =
                    device_entity.is_communication_task_running.clone();
                let stream = tauri::async_runtime::spawn(async move {
                    info!("Starting communication task");
                    if let Ok(mut is_communication_task_running) =
                        is_communication_task_running.lock()
                    {
                        *is_communication_task_running = true;
                    }
                    loop {
                        std::thread::sleep(Duration::from_millis(100));
                        if let Ok(is_communication_task_running) =
                            is_communication_task_running.lock()
                        {
                            if !*is_communication_task_running {
                                info!("Stopping communication task");
                                return;
                            }
                        }
                        read_bytes_from_device_to_buffer(
                            &mut cloned_device,
                            &mut Vec::new(),
                            &app_handle,
                        );
                    }
                });
                if let Ok(mut communication_task) = device_entity.communication_task.lock() {
                    *communication_task = Some(stream);
                }
            }
        }
    }
    return false;
}

#[tauri::command]
pub fn stop_communication_task(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut communication_task) = device_entity.communication_task.lock() {
        if let Some(communication_task) = communication_task.as_mut() {
            if let Ok(mut is_communication_task_running) =
                device_entity.is_communication_task_running.lock()
            {
                *is_communication_task_running = false;
            }
            communication_task.abort();
        }
        *communication_task = None;
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
    let mut device = device_entity.port.lock().map_err(|err| err.to_string())?;
    let device = device
        .as_mut()
        .ok_or("Could not lock the selected device".to_string())?;
    if clear_output_buffer_of_device(device) && send_bytes_to_device(device, &[0x30], &app_handle) {
        read_bytes_till_3e_from_device_to_buffer(device, &mut config_bytes_buffer, &app_handle);
        let device_config = parse_device_config(&config_bytes_buffer, None, Some(&app_handle))?;
        let mut device_config_from_state = device_entity
            .device_config
            .lock()
            .map_err(|err| err.to_string())?;
        let cloned_config = device_config.clone();
        *device_config_from_state = Some(cloned_config);
        return Ok(device_config);
    }
    return Err("Unable to get config. Looks like sending bytes failed.".to_string());
}

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

#[derive(Clone, serde::Serialize)]
pub struct RSSIEvent {
    pub rssi: f64,
    pub channel: u8,
}

#[tauri::command]
pub fn start_rssi_stream(device_entity: State<DeviceEntity>, app_handle: AppHandle) {
    info!("Starting RSSI stream");
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
                            info!("Stopping RSSI stream");
                            return;
                        }
                    }
                    for i in 1..=10 {
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
                    // std::thread::sleep(std::time::Duration::from_millis(10));
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
                .unwrap_or_else(|e| error!("Error flushing: {}", e));
            app_handle
                .emit_all(
                    "exchange_bytes_event",
                    Payload {
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

fn read_bytes_till_3e_from_device_to_buffer(
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
            Payload {
                data_type: "RX".to_string(),
                data: [buffer.to_vec(), vec![0x3e]].concat(),
            },
        )
        .unwrap_or_else(|e| error!("Error emitting: {}", e));
    count
}

fn read_bytes_from_device_to_buffer(
    device: &mut Box<dyn SerialPort>,
    buffer: &mut Vec<u8>,
    app_handle: &AppHandle,
) -> usize {
    let result = device.read_to_end(buffer).unwrap_or(0);
    if buffer.len() > 0 {
        app_handle
            .emit_all(
                "exchange_bytes_event",
                Payload {
                    data_type: "RX".to_string(),
                    data: buffer.to_vec(),
                },
            )
            .unwrap_or_else(|e| error!("Error emitting: {}", e));
    }
    result
}

// pub fn read_bytes_from_reader() {
//     let (tx, rx) = channel::<u8>(100);
//     if let Ok(mut reader_command) = TINYMESH_READER_COMMAND.lock() {
//         *reader_command = Some(ReaderCommand::CollectBytes(tx));
//     }
// }

// #[tauri::command]
// pub fn start_background_reader_process(device_entity: State<DeviceEntity>, app_handle: AppHandle) {
//     info!("Starting background reader process");
//     let device_port = device_entity.port.clone();
//     let reader_task_command = device_entity.reader_task_command.clone();
//     let stream = tauri::async_runtime::spawn(async move {
//         if let Ok(mut device) = device_port.lock() {
//             if let Some(mut device) = device.as_mut() {
//                 let mut collection_buffer: Vec<u8> = vec![];
//                 loop {
//                     let bytes_read = read_bytes_from_device_to_buffer(
//                         &mut device,
//                         &mut collection_buffer,
//                         &app_handle,
//                     );
//                     if let Ok(command) = reader_task_command.lock() {
//                         match *command {
//                             ReaderCommand::CollectBytes(sender_channel) => {
//                                 sender_channel.send(collection_buffer).unwrap();
//                             }
//                             ReaderCommand::ClearBuffer => {
//                                 collection_buffer.clear();
//                             }
//                             ReaderCommand::Stop => {
//                                 return;
//                             }
//                         }
//                     }
//                     if let Ok(is_rssi_task_running) = is_rssi_task_running.lock() {
//                         if !*is_rssi_task_running {
//                             info!("Stopping RSSI stream");
//                             return;
//                         }
//                     }
//                     for i in 1..=10 {
//                         if let Ok(is_rssi_task_running) = is_rssi_task_running.lock() {
//                             if !*is_rssi_task_running {
//                                 info!("Stopping RSSI stream");
//                                 return;
//                             }
//                         }
//                         clear_output_buffer_of_device(&mut device);
//                         let channel_switch_success = switch_to_channel(i, &mut device, &app_handle);
//                         if channel_switch_success {
//                             if let Ok(rssi) = get_rssi_from_device(&mut device, &app_handle) {
//                                 app_handle
//                                     .emit_all(
//                                         "rssi_event",
//                                         RSSIEvent {
//                                             rssi: -(rssi as f64) / 2.0,
//                                             channel: i,
//                                         },
//                                     )
//                                     .unwrap();
//                             }
//                         }
//                     }
//                     // std::thread::sleep(std::time::Duration::from_millis(10));
//                 }
//             }
//         }
//     });
//     if let Ok(mut rssi_task) = device_entity.rssi_task.lock() {
//         *rssi_task = Some(stream);
//     }
// }
