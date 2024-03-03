use std::collections::HashMap;

use crate::mk_module_description::{self, MkDeviceCell, MkModuleDescription};

pub fn parse_device_information(data: &[u8]) -> Result<HashMap<String, String>, String> {
    let mut result = HashMap::new();
    let (model, hw_version, firmware_version) = get_device_information(data)?;
    result.insert("model".to_string(), model);
    result.insert("hw_version".to_string(), hw_version);
    result.insert("firmware_version".to_string(), firmware_version);
    Ok(result)
}

fn read_cell(data: &[u8], addr: usize, module_description: &MkModuleDescription) -> MkDeviceCell {
    let result = MkDeviceCell {
        address: addr as u32,
        name: String::new(),
        description: String::new(),
        min_value: 0,
        max_value: 0,
        allowed_values: vec![],
    };

    result
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