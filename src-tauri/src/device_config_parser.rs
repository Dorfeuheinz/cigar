use std::path::Path;

use tauri::AppHandle;

use crate::mk_module_description::{
    MkDeviceCell, MkDeviceQuickMode, MkDeviceTestMode, MkModuleDescription,
};

/// This struct represents the decoded device config fetched from device
#[derive(Clone, serde::Serialize, Default, Debug)]
pub struct MkDeviceConfig {
    pub model: String,
    pub hw_version: String,
    pub firmware_version: String,
    pub cells: Vec<MkDeviceCell>,
    pub test_modes: Vec<MkDeviceTestMode>,
    pub quick_modes: Vec<MkDeviceQuickMode>,
}

/// This function parses the device config and returns a struct representing the decoded device config
///
/// # Arguments
/// * `data` - A slice of bytes representing the device config data
/// * `rmd_file_path` - An optional reference to a `Path` object representing the path to the RMD file
/// * `app_handle` - An optional reference to an `AppHandle` object
///
/// # Returns
/// A `Result` containing a `MkDeviceConfig` object if parsing is successful, or a `String` containing an error message if parsing fails
pub fn parse_device_config(
    data: &[u8],
    rmd_file_path: Option<&Path>,
    app_handle: Option<&AppHandle>,
) -> Result<MkDeviceConfig, String> {
    let (model, hw_version, firmware_version) = get_device_information(data)?;
    // from the modules folder in the current working directory, read the contents of a file named <model>.rmd
    let module_description = if let Some(rmd_file_path) = rmd_file_path {
        let file_contents =
            std::fs::read_to_string(rmd_file_path).map_err(|err| err.to_string())?;
        MkModuleDescription::new(&file_contents)
    } else {
        if app_handle.is_none() {
            return Err("App handle is None".to_string());
        }
        MkModuleDescription::new_from_device_model(&model, app_handle.unwrap())?
    };

    let cells = read_unlocked_cells(data, &module_description);
    let test_modes = module_description.testmodes;
    let quick_modes = module_description.quickmodes;
    let result = MkDeviceConfig {
        model,
        hw_version,
        firmware_version,
        cells,
        test_modes,
        quick_modes,
    };
    Ok(result)
}

fn read_unlocked_cells(data: &[u8], module_description: &MkModuleDescription) -> Vec<MkDeviceCell> {
    data.iter()
        .enumerate()
        .filter_map(|(i, val)| {
            if module_description.locked_cells.contains(&i) {
                return None;
            }
            let mut cell = module_description.cells[i].clone();
            cell.address = i;
            cell.current_value = *val;
            Some(cell)
        })
        .collect()
}

/// This function extracts the model, hardware version, and firmware version from the device config data
///
/// # Arguments
/// * `data` - A slice of bytes representing the device config data
///
/// # Returns
/// A `Result` containing a tuple of three `String` objects if parsing is successful, or a `String` containing an error message if parsing fails
pub fn get_device_information(data: &[u8]) -> Result<(String, String, String), String> {
    let mut offset = 0x3c;
    while offset < data.len() {
        if offset == 0x3c {
            if let Some(model_end) = data[offset..].iter().position(|&x| x == b',') {
                let model = String::from_utf8_lossy(&data[offset..offset + model_end]).to_string();
                offset += model_end + 1;
                if let Some(hw_end) = data[offset..].iter().position(|&x| x == b',') {
                    let hw_version =
                        String::from_utf8_lossy(&data[offset..offset + hw_end]).to_string();
                    offset += hw_end + 1;
                    if let Some(firmware_end) = data[offset..].iter().position(|&x| !x.is_ascii()) {
                        let firmware_version =
                            String::from_utf8_lossy(&data[offset..offset + firmware_end])
                                .to_string();
                        return Ok((model, hw_version, firmware_version));
                    }
                }
            }
        }
        offset += 1;
    }
    Err("Invalid data format".to_string())
}
