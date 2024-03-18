#[cfg(test)]
mod tests {
    use std::fs::read_to_string;
    use std::path::PathBuf;
    use tinymesh_cc_tool::device_config_parser::parse_device_config;

    #[test]
    fn test_device_information() {
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("resources/tests/config_response.txt");
        let config_response = read_to_string(d).unwrap();
        let device_config = config_response
            .split_whitespace()
            .map(|s| {
                u8::from_str_radix(s, 16).unwrap_or_else(|_| panic!("Invalid hex string: {}", s))
            })
            .collect::<Vec<_>>();
        println!("{:#?}", device_config);
        let rmd_file_path =
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/tests/RF TM4070.rmd");
        let device_config =
            parse_device_config(&device_config, Some(&rmd_file_path), None).unwrap();
        assert_eq!(device_config.model, "RF TM4070");
        assert_eq!(device_config.hw_version, "1.00");
        assert_eq!(device_config.firmware_version, "1.53");
    }
}
