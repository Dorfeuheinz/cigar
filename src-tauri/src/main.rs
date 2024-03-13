// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use std::sync::Mutex;

use tinymesh_cc_tool::tinymesh_comm::*;

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([tauri_plugin_log::LogTarget::Folder(
                    std::env::current_exe()
                        .unwrap()
                        .parent()
                        .unwrap()
                        .join("logs"),
                )])
                .log_name("custom-name")
                .build(),
        )
        .manage(DeviceEntity {
            port: Default::default(),
            rssi_task: Default::default(),
            is_rssi_task_running: Arc::new(Mutex::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            get_devices,
            connect_to_device,
            disconnect_from_device,
            send_bytes,
            read_bytes,
            clear_buffer,
            get_device_config,
            get_connected_device,
            get_device_rssi,
            get_device_analog,
            get_device_digital,
            get_device_temperature,
            get_device_voltage,
            execute_mode_sequence,
            start_rssi_stream,
            stop_rssi_stream
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
