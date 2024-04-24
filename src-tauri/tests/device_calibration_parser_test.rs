#[cfg(test)]
mod tests {
    use std::fs::read_to_string;
    use std::path::PathBuf;
    use tinymesh_cc_tool::device_calibration_parser::parse_device_calib;

    #[test]
    fn test_device_information() {
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("resources/tests/calibration_response.txt");
        let calib_response = read_to_string(d).unwrap();
        let device_calib = calib_response
            .split_whitespace()
            .map(|s| {
                u8::from_str_radix(s, 16).unwrap_or_else(|_| panic!("Invalid hex string: {}", s))
            })
            .collect::<Vec<_>>();
        println!("{:#?}", device_calib);
        let rmd_file_path =
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/tests/RF TM4070.rmd");
        let device_calib =
            parse_device_calib(&device_calib, Some(&rmd_file_path), None).unwrap();
        assert_eq!(device_calib.model, "RF TM4070");
        assert_eq!(device_calib.hw_version, "1.00");
        assert_eq!(device_calib.firmware_version, "1.53");
    }
}
