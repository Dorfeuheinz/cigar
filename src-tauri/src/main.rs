// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use tauri_plugin_log::{LogTarget, RotationStrategy, TimezoneStrategy};
use tinymesh_cc_tool::data_types::DeviceEntity;
use tinymesh_cc_tool::tinymesh_comm_mod::*;
use tinymesh_cc_tool::tinymesh_config_mod::*;
use tinymesh_cc_tool::tinymesh_calibration_mod::*;
use tinymesh_cc_tool::tinymesh_device_info_mod::*;
use tinymesh_cc_tool::tinymesh_serial_util::*;

#[cfg(debug_assertions)]
const LOG_TARGETS: [LogTarget; 2] = [LogTarget::Stdout, LogTarget::LogDir];

#[cfg(not(debug_assertions))]
const LOG_TARGETS: [LogTarget; 1] = [LogTarget::LogDir];

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets(LOG_TARGETS)
                .rotation_strategy(RotationStrategy::KeepOne)
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .build(),
        )
        .manage(DeviceEntity {
            port: Default::default(),
            rssi_task: Default::default(),
            is_rssi_task_running: Arc::new(Mutex::new(false)),
            communication_task: Default::default(),
            is_communication_task_running: Arc::new(Mutex::new(false)),
            device_config: Arc::new(Mutex::new(None)),
            device_calib: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            // communication functions
            start_communication_task,
            stop_communication_task,
            // config functions
            get_device_config,
            set_device_config,
            execute_mode_sequence,
            factory_reset,
            // calibration functions
            get_device_calib,
            set_device_calib,
            // serial functions
            reset_program_state,
            get_devices,
            connect_to_device,
            disconnect_from_device,
            send_bytes,
            read_bytes,
            clear_buffer,
            get_connected_device,
            // device info functions
            get_device_rssi,
            get_device_analog,
            get_device_digital,
            get_device_temperature,
            get_device_voltage,
            start_rssi_stream,
            stop_rssi_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
