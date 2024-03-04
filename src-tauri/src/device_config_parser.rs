use std::path::Path;

use crate::mk_module_description::{MkDeviceCell, MkModuleDescription};

#[derive(Clone, serde::Serialize, Default, Debug)]
pub struct MkDeviceConfig {
    pub model: String,
    pub hw_version: String,
    pub firmware_version: String,
    pub cells: Vec<MkDeviceCell>,
}


pub fn parse_device_config(data: &[u8], rmd_file_path: Option<&Path>) -> Result<MkDeviceConfig, String> {
    let (model, hw_version, firmware_version) = get_device_information(data)?;
    // from the modules folder in the current working directory, read the contents of a file named <model>.rmd
    let module_description = if let Some(rmd_file_path) = rmd_file_path {
        let file_contents = std::fs::read_to_string(rmd_file_path).map_err(|err| err.to_string())?;
        MkModuleDescription::new(&file_contents)
    } else {
        MkModuleDescription::new_from_device_model(&model)?
    };
    
    let cells = read_cells(data, &module_description);
    let result = MkDeviceConfig {
        model,
        hw_version,
        firmware_version,
        cells
    };
    Ok(result)
}

fn read_cells(data: &[u8], module_description: &MkModuleDescription) -> Vec<MkDeviceCell> {
    module_description.cells.iter().map(|cell| {
        let mut cell = cell.clone();
        cell.current_value = data[cell.address as usize];
        cell
    }).collect()
}

fn get_device_information(data: &[u8]) -> Result<(String, String, String), String> {
    let mut offset = 0x3c;
    while offset < data.len() {
        if offset == 0x3c {
            if let Some(model_end) = data[offset..].iter().position(|&x| x == b',') {
                let model = String::from_utf8_lossy(&data[offset..offset + model_end]).to_string();
                offset += model_end + 1;
                if let Some(hw_end) = data[offset..].iter().position(|&x| x == b',') {
                    let hw_version = String::from_utf8_lossy(&data[offset..offset + hw_end]).to_string();
                    offset += hw_end + 1;
                    if let Some(firmware_end) = data[offset..].iter().position(|&x| !x.is_ascii()) {
                        let firmware_version = String::from_utf8_lossy(&data[offset..offset + firmware_end]).to_string();
                        return Ok((model, hw_version, firmware_version));
                    }
                }
            }
        }
        offset += 1;
    }
    Err("Invalid data format".to_string())
}