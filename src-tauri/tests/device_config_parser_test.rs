#[cfg(test)]
mod tests {
    use tinymesh_cc_tool::device_config_parser::parse_device_information;
    use std::fs::read_to_string;
    use std::path::PathBuf;

    #[test]
    fn test_device_information() {
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("resources/tests/config_response.txt");
        let config_response = read_to_string(d).unwrap();
        let device_config = config_response
            .split_whitespace()
            .map(|s| u8::from_str_radix(s, 16).unwrap_or_else(|_| panic!("Invalid hex string: {}", s)))
            .collect::<Vec<_>>();
        println!("{:#?}", device_config);
        let map = parse_device_information(&device_config).unwrap();
        assert_eq!(map.get("model").unwrap(), "RF TM4070");
        assert_eq!(map.get("hw_version").unwrap(), "1.00");
        assert_eq!(map.get("firmware_version").unwrap(), "1.53");
    }
}