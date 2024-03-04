#[cfg(test)]
mod tests {
    use tinymesh_cc_tool::module_description_parser::parse_module_description;
    use std::fs::read_to_string;
    use std::path::PathBuf;

    #[test]
    fn test_parse_module_description() {
        // read the contents of the custom file into a string
        let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        d.push("resources/tests/RF TM4070.rmd");
        let custom_file_content = read_to_string(d).unwrap();
        let result = parse_module_description(&custom_file_content);
        
        // you can use println!("{:#?}", result) to print the result in a readable format.
        // use cargo test -- --nocapture to see the output of println! macro in tests
        println!("{:#?}", result);
        assert_eq!(result.get("DEVICE_MODEL").unwrap(), "RF TM4070");
    }
}
