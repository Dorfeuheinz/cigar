pub mod data_types;
pub mod device_config_parser;
pub mod device_calibration_parser;
pub mod input_processing;
pub mod mk_module_description;
pub mod module_description_parser;

// Modules containing functions for communicating with Tauri frontend
pub mod tinymesh_comm_mod;
pub mod tinymesh_config_mod;
pub mod tinymesh_calibration_mod;
pub mod tinymesh_device_info_mod;
pub mod tinymesh_serial_util;
