use std::collections::HashMap;

pub fn parse_custom_string(input: &str) -> HashMap<String, String> {
    let mut result = HashMap::new();
    let mut section_name = String::new();
    let mut section_content = String::new();
    
    for line in input.lines() {
        let line_without_comment = match line.find("//") {
            Some(index) => &line[..index].trim_end(),
            None => line,
        };
        
        if line_without_comment.is_empty() {
            continue; // Ignore empty lines
        }
        
        if line_without_comment.starts_with("[") {
            if !section_name.is_empty() {
                result.insert(section_name.clone(), section_content.clone());
                section_content.clear();
            }
            section_name = line_without_comment.trim_matches(|c| c == '[' || c == ']').to_string();
        } else {
            section_content.push_str(line_without_comment);
        }
    }
    
    if !section_name.is_empty() && !section_content.is_empty() {
        result.insert(section_name, section_content);
    }
    
    result
}