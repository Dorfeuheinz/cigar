//! Data types used in the app backend

use std::sync::{Arc, Mutex};

use serialport::SerialPort;
use tauri::async_runtime::JoinHandle;

/// Data type for the testmode sequence.
/// Conceptually, both testmode and quickmode sequence datatypes are the same.
/// Both are used for the same purpose, but segregated in the frontend.
#[derive(Clone, Debug, serde::Serialize)]
pub struct MkDeviceTestMode {
    pub testmode_id: usize,
    pub name: String,
    pub description: String,
    pub sequence_on: String,
    pub sequence_off: String,
}

/// Data type for the quickmode sequence.
/// Conceptually, both testmode and quickmode sequence datatypes are the same.
/// Both are used for the same purpose, but segregated in the frontend.
#[derive(Clone, Debug, serde::Serialize)]
pub struct MkDeviceQuickMode {
    pub testmode_id: usize,
    pub name: String,
    pub description: String,
    pub sequence_on: String,
    pub sequence_off: String,
}

/// Data type for the device configuration cell
#[derive(Clone, Default, Debug, serde::Serialize, serde::Deserialize)]
pub struct MkDeviceCell {
    pub address: usize,
    pub name: String,
    pub description: String,
    pub min_value: u8,
    pub max_value: u8,
    pub allowed_values: Vec<u8>,
    pub default_value: u8,
    pub current_value: u8,
}

/// DeviceEntity contains the state of the program
pub struct DeviceEntity {
    /// The device serial port connection that can be shared across threads
    pub port: Arc<Mutex<Option<Box<dyn SerialPort>>>>,

    /// Tokio tasks for streaming RSSI in spectrum analyzer mode and background communication
    pub rssi_task: Mutex<Option<JoinHandle<()>>>,
    pub is_rssi_task_running: Arc<Mutex<bool>>,
    pub communication_task: Mutex<Option<JoinHandle<()>>>,
    pub is_communication_task_running: Arc<Mutex<bool>>,

    /// Device config is stored inside the state of the program
    pub device_config: Arc<Mutex<Option<MkDeviceConfig>>>,
    /// Device calibration is stored inside the state of the program
    pub device_calib: Arc<Mutex<Option<MkDeviceCalib>>>,
}

/// EventPayload contains the data that is sent to the frontend logging panel
#[derive(Clone, serde::Serialize)]
pub struct EventPayload {
    pub data_type: String,
    pub data: Vec<u8>,
}

/// This struct represents the decoded device config fetched from device
#[derive(Clone, serde::Serialize, Default, Debug)]
pub struct MkDeviceConfig {
    pub model: String,
    pub hw_version: String,
    pub firmware_version: String,
    pub cells: Vec<MkDeviceCell>,
    pub test_modes: Vec<MkDeviceTestMode>,
    pub quick_modes: Vec<MkDeviceQuickMode>,
    pub editable_cells: Vec<usize>,
    pub locked_cells: Vec<usize>
}

/// This struct represents the decoded device calib fetched from device
#[derive(Clone, serde::Serialize, Default, Debug)]
pub struct MkDeviceCalib {
    pub model: String,
    pub calibration_cells: Vec<MkDeviceCell>,
    pub c_editable_cells: Vec<usize>,
    pub c_locked_cells: Vec<usize>
}
