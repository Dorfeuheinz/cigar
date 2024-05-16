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
    model: String,
    rmd_file_path: Option<&Path>,
    app_handle: Option<&AppHandle>,
) -> Result<MkDeviceCalib, String> {
    // info!("\n\ndevice_calibration_parser::parse_device_calib(data, rmd_file_path, app_handle)\n\n");
    // info!("Data we get in device_calibration_parser::parse_device_calib-> {:?}", data);
    // let (model, _hw_version, _firmware_version) = get_device_information(data)?;
    // from the modules folder in the current working directory, read the contents of a file named <model>.rmd
    let module_description = if let Some(rmd_file_path) = rmd_file_path {
        let file_contents =
            std::fs::read_to_string(rmd_file_path).map_err(|err| err.to_string())?;
        MkModuleDescription::new(&file_contents)
    } else {
        if app_handle.is_none() {
            return Err("App handle is None".to_string());
        }
        // let file_contents =
        //     std::fs::read_to_string("resources/modules/RF TM4070.rmd").map_err(|err| err.to_string())?;
        // MkModuleDescription::new(&file_contents)
        MkModuleDescription::new_from_device_model(&model, app_handle.unwrap())?
    };

    let calibration_cells = read_unlocked_cells(data, &module_description);
    let c_editable_cells = module_description.c_editable_cells;
    let c_locked_cells = module_description.c_locked_cells;

    let result = MkDeviceCalib {
        model,
        calibration_cells,
        c_editable_cells,
        c_locked_cells
    };
    Ok(result)
}
// use log::info;

// Maheep sirs implementation, changed since unlocked cells arent required to be passed, but all cells must be passed & locked will be disabled
// editing purposes in the UI. Requirements changed from clients end
fn read_unlocked_cells(data: &[u8], module_description: &MkModuleDescription) -> Vec<MkDeviceCell> {
    // info!("------------READ UNLOKD CELLS-------------{:?}", data);
    data.iter()
        .enumerate()
        .filter_map(|(i, val)| {
            // if module_description.c_locked_cells.contains(&i) {
            //     return None;
            // }
            let mut cell = module_description.calibration_cells[i].clone();
            cell.address = i;
            cell.current_value = *val;
            Some(cell)
        })
        .collect()
    // info!("------------READ UNLOKD CELLS AFTER ITER-------------{:?}", r);
}



// fn decimal_to_hex(input: &[u8]) -> Vec<String> {
//     input.iter()
//         .map(|&decimal| format!("{:02X}", decimal)) // Convert each decimal to hexadecimal
//         .collect()
// }

// fn decimal_to_ascii(input: &[u8]) -> Vec<char> {
//     input.iter()
//         .map(|&decimal| {
//             if decimal.is_ascii() { // Check if the decimal is within the ASCII range
//                 decimal as char // Convert to ASCII character
//             } else {
//                 '?' // If not in ASCII range, represent as '?' character
//             }
//         })
//         .collect()
// }

// pub fn get_device_information(data: &[u8]) -> Result<(String, String, String), String> {
//     let mut offset = 0x3c;
//     if offset >= data.len() {
//         return Err("Invalid data format for calibration".to_string());
//     }
//     let model_end = data[offset..]
//         .iter()
//         .position(|&x| x == b',')
//         .ok_or("Invalid data format. Could not find model end")?;
//     let model = String::from_utf8_lossy(&data[offset..offset + model_end]).to_string();
//     offset += model_end + 1;
//     let hw_end = data[offset..]
//         .iter()
//         .position(|&x| x == b',')
//         .ok_or("Invalid data format. Could not find hw end")?;
//     let hw_version = String::from_utf8_lossy(&data[offset..offset + hw_end]).to_string();
//     offset += hw_end + 1;
//     let firmware_end = data[offset..]
//         .iter()
//         .position(|&x| !x.is_ascii())
//         .ok_or("Invalid data format. Could not find fw end")?;
//     let firmware_version =
//         String::from_utf8_lossy(&data[offset..offset + min(firmware_end, 4)]).to_string();
//     Ok((model, hw_version, firmware_version))
// }
