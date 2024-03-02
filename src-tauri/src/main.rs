// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tinymesh_cc_tool::tinymesh_comm::*;

fn main() {
    tauri::Builder::default()
        .manage(DeviceEntity(Default::default()))
        .invoke_handler(
            tauri::generate_handler![
                get_devices,
                connect_to_device,
                disconnect_from_device,
                send_bytes,
                read_bytes
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
