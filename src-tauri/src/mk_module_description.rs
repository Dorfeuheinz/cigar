use std::collections::HashMap;
use crate::module_description_parser::parse_module_description;

#[derive(Debug)]
pub struct MkDeviceTestMode {
    pub testmode_id: u32,
    pub description: String,
}

#[derive(Debug)]
pub struct MkDeviceCell {
    pub address: u32,
    pub name: String,
    pub description: String,
    pub min_value: u32,
    pub max_value: u32,
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

impl MkModuleDescription {
    fn new(input: &str) -> MkModuleDescription {
        let mut result: MkModuleDescription = Default::default();
        result.unknown_data = parse_module_description(input);
        result.editable_cells = get_editable_cells_and_remove_from_unknown(&mut result);
        result.locked_cells = get_locked_cells_and_remove_from_unknown(&mut result);
        result.device_model = get_device_model_and_remove_from_unknown(&mut result);
        result.number_of_testmodes = get_number_of_testmodes_and_remove_from_unknown(&mut result);
        result
    }

    fn validate_device_config() -> Result<(), ()> {
        Ok(())
    }
}