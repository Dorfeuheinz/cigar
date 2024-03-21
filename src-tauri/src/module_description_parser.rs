//! This is a low-level parser module contains code that parses the module description from the RMD string.
use std::collections::HashMap;

/// Parses the module description from the RMD string.
/// Follows the following rules while parsing:
/// - Sections are delimited by square brackets.
/// - Empty sections are ignored, but they are considered as end of previous section content.
/// - Anything starting after `//` is considered a comment.
/// - Blank lines are ignored.
///
/// # Arguments
/// `input` - The RMD string to parse.
///
/// # Returns
/// A key-value map of section names as keys and their contents as values.
pub fn parse_module_description(input: &str) -> HashMap<String, String> {
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
        } else if line_without_comment.starts_with("[") {
            if !section_name.is_empty() {
                result.insert(section_name.clone(), section_content.trim_end().to_string());
                section_content.clear();
            }
            section_name = line_without_comment
                .trim_matches(|c| c == '[' || c == ']')
                .to_string();
        } else {
            section_content.push_str(line_without_comment);
            section_content.push('\n');
        }
    }

    if !section_name.is_empty() && !section_content.is_empty() {
        result.insert(section_name, section_content.trim_end().to_string());
    }

    result
}
