//! This module servers as a high-level RMD file parser.
//! It contains the `MkModuleDescription` struct that holds all the data from the RMD module description.
use log::info;
use tauri::AppHandle;

use crate::data_types::{MkDeviceCell, MkDeviceQuickMode, MkDeviceTestMode};
use crate::module_description_parser::parse_module_description;
use std::collections::HashMap;

/// This struct holds all the data from the RMD module description.
#[derive(Default, Debug)]
pub struct MkModuleDescription {
    pub device_model: String,
    pub number_of_testmodes: usize,
    pub testmodes: Vec<MkDeviceTestMode>,
    pub number_of_quickmodes: usize,
    pub quickmodes: Vec<MkDeviceQuickMode>,
    pub cells: Vec<MkDeviceCell>,
    pub calibration_cells: Vec<MkDeviceCell>,

    pub editable_cells: Vec<usize>,
    pub locked_cells: Vec<usize>,
    pub c_editable_cells: Vec<usize>,
    pub c_locked_cells: Vec<usize>,

    pub unknown_data: HashMap<String, String>,
}

fn get_number_of_testmodes_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> usize {
    if let Some(number_of_testmodes) = module_description.unknown_data.remove("TESTMODE NUMBER") {
        return number_of_testmodes.parse::<usize>().unwrap();
    }
    return 0;
}

fn get_number_of_quickmodes_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> usize {
    if let Some(number_of_quickmodes) = module_description.unknown_data.remove("QUICKMODE NUMBER") {
        return number_of_quickmodes.parse::<usize>().unwrap();
    }
    return 0;
}

fn get_editable_cells_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<usize> {
    if let Some(editable_cells) = module_description.unknown_data.remove("M EDITABLE_CELLS") {
        return editable_cells
            .split_whitespace()
            .filter_map(|s| {
                if s.starts_with("0x") {
                    usize::from_str_radix(&s.trim_start_matches("0x"), 16).ok()
                } else {
                    s.parse::<usize>().ok()
                }
            })
            .collect();
    }
    return vec![];
}

fn get_locked_cells_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<usize> {
    if let Some(locked_cells) = module_description.unknown_data.remove("M LOCKED_CELLS") {
        return locked_cells
            .split_whitespace()
            .filter_map(|s| {
                if s.starts_with("0x") {
                    usize::from_str_radix(&s.trim_start_matches("0x"), 16).ok()
                } else {
                    s.parse::<usize>().ok()
                }
            })
            .collect();
    }
    return vec![];
}

fn get_c_editable_cells_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<usize> {
    if let Some(c_editable_cells) = module_description.unknown_data.remove("C EDITABLE_CELLS") {
        return c_editable_cells
            .split_whitespace()
            .filter_map(|s| {
                if s.starts_with("0x") {
                    usize::from_str_radix(&s.trim_start_matches("0x"), 16).ok()
                } else {
                    s.parse::<usize>().ok()
                }
            })
            .collect();
    }
    return vec![];
}

fn get_c_locked_cells_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<usize> {
    if let Some(c_locked_cells) = module_description.unknown_data.remove("C LOCKED_CELLS") {
        return c_locked_cells
            .split_whitespace()
            .filter_map(|s| {
                if s.starts_with("0x") {
                    usize::from_str_radix(&s.trim_start_matches("0x"), 16).ok()
                } else {
                    s.parse::<usize>().ok()
                }
            })
            .collect();
    }
    return vec![];
}

fn get_device_model_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> String {
    if let Some(device_model) = module_description.unknown_data.remove("DEVICE_MODEL") {
        return device_model.clone();
    }
    return String::new();
}

fn check_cell_key(starting_str: &str, input: &str) -> Result<(usize, String), ()> {
    let parts: Vec<&str> = input.split_whitespace().collect();
    if parts.len() == 3 && parts[0] == starting_str && parts[1].starts_with("0x") {
        let hex_number =
            usize::from_str_radix(&parts[1].trim_start_matches("0x"), 16).map_err(|_| ())?;
        return Ok((hex_number, parts[2].to_string()));
    }
    Err(())
}

fn get_cells_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<MkDeviceCell> {
    info!("\n\nmk_module_description::get_cells_and_remove_from_unknown(module_description)\n");
    // info!("\nmk_module_description::get_cells_and_remove_from_unknown---> module_description = {:?}\n", module_description);

    // find all keys of the format "M 0x<some hex number> <some text>"
    let mut result: Vec<MkDeviceCell> = vec![Default::default(); 256];
    for i in 0..result.len() {
        result[i].address = i;
    }
    for (key, value) in &module_description.unknown_data {
        // use regex matching on key. the format of the key is "M 0x<some hex number> <some text>"
        // we want to extract the hex number and some text
        if let Ok((address, name)) = check_cell_key("M", key) {
            // resize vector to fit the address
            if address >= result.len() {
                result.resize(address as usize + 1, Default::default());
                result[address as usize].address = address;
            }
            if name == "NAME" {
                result[address as usize].name = value.clone();
            } else if name == "HINT" {
                result[address as usize].description = value.clone();
            } else if name == "DEF" {
                result[address as usize].default_value = value.parse::<u8>().unwrap();
                result[address as usize].current_value = result[address as usize].default_value;
            } else if name == "MIN_MAX" {
                let (min, max) = value.split_once(' ').unwrap();
                result[address as usize].min_value = min.parse::<u8>().unwrap();
                result[address as usize].max_value = max.parse::<u8>().unwrap();
            } else if name == "ALLOW" {
                result[address as usize].allowed_values = value
                    .split_whitespace()
                    .map(|s| s.parse::<u8>().unwrap())
                    .collect();
            }
        }
    }

    // remove all keys starting from "M "
    module_description
        .unknown_data
        .retain(|k, _| !k.starts_with("M "));
    // info!("\nmk_module_description::get_cells_and_remove_from_unknown---> result = {:?}\n", result);
    return result;
}

fn get_calibration_cells_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<MkDeviceCell> {
    info!("\n\nmk_module_description::get_calibration_cells_and_remove_from_unknown(module_description)\n");
    // info!("\nmk_module_description::get_calibration_cells_and_remove_from_unknown---> module_description = {:?}\n", module_description);

    // find all keys of the format "C 0x<some hex number> <some text>"
    let mut result: Vec<MkDeviceCell> = vec![Default::default(); 256];
    for i in 0..result.len() {
        result[i].address = i;
    }
    for (key, value) in &module_description.unknown_data {
        // use regex matching on key. the format of the key is "C 0x<some hex number> <some text>"
        // we want to extract the hex number and some text
        if let Ok((address, name)) = check_cell_key("C", key) {
            // resize vector to fit the address
            if address >= result.len() {
                result.resize(address as usize + 1, Default::default());
                result[address as usize].address = address;
            }
            if name == "NAME" {
                result[address as usize].name = value.clone();
            } else if name == "HINT" {
                result[address as usize].description = value.clone();
            } else if name == "DEF" {
                result[address as usize].default_value = value.parse::<u8>().unwrap();
                result[address as usize].current_value = result[address as usize].default_value;
            } else if name == "MIN_MAX" {
                let (min, max) = value.split_once(' ').unwrap();
                result[address as usize].min_value = min.parse::<u8>().unwrap();
                result[address as usize].max_value = max.parse::<u8>().unwrap();
            } else if name == "ALLOW" {
                result[address as usize].allowed_values = value
                    .split_whitespace()
                    .map(|s| s.parse::<u8>().unwrap())
                    .collect();
            }
        }
    }

    // remove all keys starting from "C "
    module_description
        .unknown_data
        .retain(|k, _| !k.starts_with("C "));
    // info!("\nmk_module_description::get_calibration_cells_and_remove_from_unknown---> result = {:?}\n", result);
    return result;
}

fn get_testmodes_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<MkDeviceTestMode> {
    let mut result = vec![];
    let number_of_testmodes = module_description.number_of_testmodes;
    for i in 1..=number_of_testmodes {
        result.push(MkDeviceTestMode {
            testmode_id: i,
            name: module_description
                .unknown_data
                .remove(&format!("TESTMODE {} NAME", i))
                .unwrap_or(String::new()),
            description: module_description
                .unknown_data
                .remove(&format!("TESTMODE {} HINT", i))
                .unwrap_or(String::new()),
            sequence_on: module_description
                .unknown_data
                .remove(&format!("TESTMODE {} SEQUENCE_ON", i))
                .unwrap_or(String::new()),
            sequence_off: module_description
                .unknown_data
                .remove(&format!("TESTMODE {} SEQUENCE_OFF", i))
                .unwrap_or(String::new()),
        });
    }
    return result;
}

fn get_quick_modes_and_remove_from_unknown(
    module_description: &mut MkModuleDescription,
) -> Vec<MkDeviceQuickMode> {
    let mut result = vec![];
    let number_of_quickmodes = module_description.number_of_quickmodes;
    for i in 1..=number_of_quickmodes {
        result.push(MkDeviceQuickMode {
            testmode_id: i,
            name: module_description
                .unknown_data
                .remove(&format!("QUICKMODE {} NAME", i))
                .unwrap_or(String::new()),
            description: module_description
                .unknown_data
                .remove(&format!("QUICKMODE {} HINT", i))
                .unwrap_or(String::new()),
            sequence_on: module_description
                .unknown_data
                .remove(&format!("QUICKMODE {} SEQUENCE_ON", i))
                .unwrap_or(String::new()),
            sequence_off: module_description
                .unknown_data
                .remove(&format!("QUICKMODE {} SEQUENCE_OFF", i))
                .unwrap_or(String::new()),
        });
    }
    return result;
}

impl MkModuleDescription {
    /// Creates a new MkModuleDescription from RMD string.
    /// This serves as a high-level RMD file parser that creates a ModuleDescription
    /// struct by calling the low-level `module_description_parser` and
    /// then extracting the corresponding entries from the key-value map.
    ///
    /// # Arguments
    /// * `input` - The RMD string to parse.
    ///
    /// # Returns
    /// A `MkModuleDescription` struct containing the parsed data.
    pub fn new(input: &str) -> MkModuleDescription {
        let mut result: MkModuleDescription = Default::default();
        result.unknown_data = parse_module_description(input);
        // info!("\n\nUNKNOWN DATA --->   {:?}\n\n", result.unknown_data);?
        result.editable_cells = get_editable_cells_and_remove_from_unknown(&mut result);
        result.locked_cells = get_locked_cells_and_remove_from_unknown(&mut result);
        result.c_editable_cells = get_c_editable_cells_and_remove_from_unknown(&mut result);
        result.c_locked_cells = get_c_locked_cells_and_remove_from_unknown(&mut result);
        result.device_model = get_device_model_and_remove_from_unknown(&mut result);
        result.number_of_testmodes = get_number_of_testmodes_and_remove_from_unknown(&mut result);
        result.testmodes = get_testmodes_and_remove_from_unknown(&mut result);
        result.number_of_quickmodes = get_number_of_quickmodes_and_remove_from_unknown(&mut result);
        result.quickmodes = get_quick_modes_and_remove_from_unknown(&mut result);
        result.cells = get_cells_and_remove_from_unknown(&mut result);
        result.calibration_cells = get_calibration_cells_and_remove_from_unknown(&mut result);
        result
    }

    /// Creates a new MkModuleDescription from RMD file.
    /// Reads the contents of the RMD file matching the model of the device and calls `new`.
    ///
    /// # Arguments
    /// * `model` - The model of the device.
    /// * `app_handle` - The app handle (reference passed manually to resolve RMD file path).
    ///
    /// # Returns
    /// A Result Ok containing a `MkModuleDescription` struct containing the parsed data if the parsing was successful.
    /// An error of type `String` if the parsing failed.
    pub fn new_from_device_model(
        model: &str,
        _app_handle: &AppHandle,
    ) -> Result<MkModuleDescription, String> {
        info!("\nmk_module_description::new_from_device_model(model, app_handle)\n");

        // let file_path = app_handle
        //     .path_resolver()
        //     .resolve_resource(format!("/modules/{}.rmd", model))
        //     .ok_or("File not found".to_string())?;
        // // info!("\nmk_module_description::new_from_device_model---> File path: {:?}\n", file_path);
        // let file_contents = std::fs::read_to_string(file_path).map_err(|err| err.to_string())?;
        // // info!("\nmk_module_description::new_from_device_model---> File contents: {:?}\n", file_contents);


        let exe_path = std::env::current_exe().map_err(|err| err.to_string())?;
    
        // Construct the path to the resource directory relative to the binary
        let resource_dir = exe_path
            .parent()
            .ok_or("Failed to determine parent directory of executable".to_string())?
            .join("modules");
    
        // Append the filename to the resource directory path
        let file_path = resource_dir.join(format!("{}.rmd", model)); // Assuming `model` is defined elsewhere
        println!("file path --> {:?}", file_path);

        // Read the contents of the file
        let file_contents = std::fs::read_to_string(&file_path)
            .map_err(|err| format!("Failed to read file '{}': {}", file_path.display(), err))?;

        Ok(MkModuleDescription::new(&file_contents))
    }
}
