use std::cmp::min;
use std::path::Path;

use tauri::AppHandle;

use crate::data_types::{MkDeviceCell, MkDeviceCalib};
use crate::mk_module_description::MkModuleDescription;

/// This function parses the device calibration and returns a struct representing the decoded device calibration
///
/// # Arguments
/// * `data` - A slice of bytes representing the device calibration data
/// * `rmd_file_path` - An optional reference to a `Path` object representing the path to the RMD file
/// * `app_handle` - An optional reference to an `AppHandle` object
///
/// # Returns
/// A `Result` containing a `MkDeviceCalib` object if parsing is successful, or a `String` containing an error message if parsing fails
pub fn parse_device_calib(
    data: &[u8],
    rmd_file_path: Option<&Path>,
    app_handle: Option<&AppHandle>,
) -> Result<MkDeviceCalib, String> {
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

    let calibration_cells = read_unlocked_cells(data, &module_description);
    let test_modes = module_description.testmodes;
    let quick_modes = module_description.quickmodes;
    let result = MkDeviceCalib {
        model,
        hw_version,
        firmware_version,
        calibration_cells,
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
            let mut cell = module_description.calibration_cells[i].clone();
            cell.address = i;
            cell.current_value = *val;
            Some(cell)
        })
        .collect()
}

/// This function extracts the model, hardware version, and firmware version from the device calibration data
///
/// # Arguments
/// * `data` - A slice of bytes representing the device calibration data
///
/// # Returns
/// A `Result` containing a tuple of three `String` objects if parsing is successful, or a `String` containing an error message if parsing fails
pub fn get_device_information(data: &[u8]) -> Result<(String, String, String), String> {
    let mut offset = 0x3c;
    if offset >= data.len() {
        return Err("Invalid data format".to_string());
    }
    let model_end = data[offset..]
        .iter()
        .position(|&x| x == b',')
        .ok_or("Invalid data format. Could not find model end")?;
    let model = String::from_utf8_lossy(&data[offset..offset + model_end]).to_string();
    offset += model_end + 1;
    let hw_end = data[offset..]
        .iter()
        .position(|&x| x == b',')
        .ok_or("Invalid data format. Could not find hw end")?;
    let hw_version = String::from_utf8_lossy(&data[offset..offset + hw_end]).to_string();
    offset += hw_end + 1;
    let firmware_end = data[offset..]
        .iter()
        .position(|&x| !x.is_ascii())
        .ok_or("Invalid data format. Could not find fw end")?;
    let firmware_version =
        String::from_utf8_lossy(&data[offset..offset + min(firmware_end, 4)]).to_string();
    Ok((model, hw_version, firmware_version))
}
