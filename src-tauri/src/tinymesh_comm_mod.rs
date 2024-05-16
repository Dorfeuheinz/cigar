//! This module contains functions related to background communication with TinyMesh devices.
//! These functions are used by the Tauri frontend for processing background communication.
use crate::data_types::DeviceEntity;
use crate::tinymesh_serial_util::read_bytes_from_device_to_buffer;

use std::time::Duration;
use tauri::{AppHandle, State};

/// This function starts the background communication task.
/// It checks if the task is already running and starts it if it isn't.
/// It also sets the `is_communication_task_running` flag to `true` to indicate that the task is running.
/// It adds the running task to the `communication_task` field of the `DeviceEntity` state.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
/// * `app_handle` - The Tauri application handle (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the communication task was started successfully.
#[tauri::command]
pub fn start_communication_task(device_entity: State<DeviceEntity>, app_handle: AppHandle) -> bool {
    if let Ok(mut device) = device_entity.port.lock() {
        if let Some(device) = device.as_mut() {
            if let Ok(mut cloned_device) = device.try_clone() {
                let is_communication_task_running =
                    device_entity.is_communication_task_running.clone();
                if let Ok(mut is_communication_task_running) = is_communication_task_running.lock()
                {
                    if !*is_communication_task_running {
                        *is_communication_task_running = true;
                    } else {
                        return true;
                    }
                }
                let stream = tauri::async_runtime::spawn(async move {
                    // info!("Starting communication task");
                    loop {
                        std::thread::sleep(Duration::from_millis(100));
                        if let Ok(is_communication_task_running) =
                            is_communication_task_running.lock()
                        {
                            if !*is_communication_task_running {
                                // info!("Stopping communication task");
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
                    return true;
                }
            }
        }
    }
    return false;
}

/// This function stops the background communication task.
/// It checks if the task is running and stops it if it is.
/// It also sets the `is_communication_task_running` flag to `false` to indicate that the task is not running.
/// It removes the running task from the `communication_task` field of the `DeviceEntity` state.
/// # Arguments
/// * `device_entity` - The state of the program (provided by Tauri)
///
/// # Returns
/// A boolean value indicating whether the communication task was stopped successfully.
#[tauri::command]
pub fn stop_communication_task(device_entity: State<DeviceEntity>) -> bool {
    if let Ok(mut communication_task) = device_entity.communication_task.lock() {
        if let Some(communication_task) = communication_task.as_mut() {
            if let Ok(mut is_communication_task_running) =
                device_entity.is_communication_task_running.lock()
            {
                if *is_communication_task_running {
                    *is_communication_task_running = false;
                }
            }
            communication_task.abort();
        }
        *communication_task = None;
        return true;
    }
    return false;
}
