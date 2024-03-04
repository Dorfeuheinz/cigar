use std::collections::HashMap;
use crate::module_description_parser::parse_module_description;

#[derive(Debug)]
pub struct MkDeviceTestMode {
    pub testmode_id: u32,
    pub description: String,
}

#[derive(Clone, Default, Debug)]
pub struct MkDeviceCell {
    pub address: u8,
    pub name: String,
    pub description: String,
    pub min_value: u8,
    pub max_value: u8,
    pub allowed_values: Vec<u8>,
    pub default_value: u8,
    pub current_value: u8,
}

#[derive(Default, Debug)]
pub struct MkModuleDescription {
    pub device_model: String,
    pub number_of_testmodes: u32,
    pub testmodes: Vec<MkDeviceTestMode>,
    pub cells: Vec<MkDeviceCell>,

    pub editable_cells: Vec<u32>,
    pub locked_cells: Vec<u32>,
    
    pub unknown_data: HashMap<String, String>,
}

fn get_number_of_testmodes_and_remove_from_unknown(module_description: &mut MkModuleDescription) -> u32 {
    if let Some(number_of_testmodes) = module_description.unknown_data.remove("TESTMODE NUMBER") {
        return number_of_testmodes.parse::<u32>().unwrap();
    }
    return 0;
}

fn get_editable_cells_and_remove_from_unknown(module_description: &mut MkModuleDescription) -> Vec<u32> {
    if let Some(editable_cells) = module_description.unknown_data.remove("EDITABLE_CELLS") {
        return editable_cells.split_whitespace().filter_map(|s| s.parse::<u32>().ok()).collect();
    }
    return vec![];
}

fn get_locked_cells_and_remove_from_unknown(module_description: &mut MkModuleDescription) -> Vec<u32> {
    if let Some(locked_cells) = module_description.unknown_data.remove("LOCKED_CELLS") {
        return locked_cells.split_whitespace().filter_map(|s| s.parse::<u32>().ok()).collect();
    }
    return vec![];
}

fn get_device_model_and_remove_from_unknown(module_description: &mut MkModuleDescription) -> String {
    if let Some(device_model) = module_description.unknown_data.remove("DEVICE_MODEL") {
        return device_model.clone();
    }
    return String::new();
}

fn get_cells_and_remove_from_unknown(module_description: &mut MkModuleDescription) -> Vec<MkDeviceCell> {
    // find all keys of the format "M 0x<some hex number> <some text>"
    let mut result: Vec<MkDeviceCell> = vec![Default::default();256];
    for i in 0..255 {
        result[i].address = i as u8;
    }
    for (key, value) in &module_description.unknown_data {
        if key.starts_with("M ") {
            let mut splitted = key.split_whitespace();
            splitted.next();
            let address = splitted.next().unwrap();
            // convert the address to u8
            let address = u8::from_str_radix(address, 16).unwrap();
            splitted.next();
            let name = splitted.next().unwrap();

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
                result[address as usize].allowed_values = value.split_whitespace().map(|s| s.parse::<u8>().unwrap()).collect();
            }
        }
    }

    // remove all keys starting from "M "
    module_description.unknown_data.retain(|k, _| !k.starts_with("M "));
    return result;
}

impl MkModuleDescription {
    fn new(input: &str) -> MkModuleDescription {
        let mut result: MkModuleDescription = Default::default();
        result.unknown_data = parse_module_description(input);
        result.editable_cells = get_editable_cells_and_remove_from_unknown(&mut result);
        result.locked_cells = get_locked_cells_and_remove_from_unknown(&mut result);
        result.device_model = get_device_model_and_remove_from_unknown(&mut result);
        result.number_of_testmodes = get_number_of_testmodes_and_remove_from_unknown(&mut result);
        result.cells = get_cells_and_remove_from_unknown(&mut result);
        result
    }

    fn validate_device_config() -> Result<(), ()> {
        Ok(())
    }
}