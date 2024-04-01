//! Converts a string read from the Communication Panel's textarea into a vector of bytes.

#[derive(Debug, PartialEq)]
pub enum InputError {
    InvalidByteSequence(String),
}

/// Converts a string read from the Communication Panel's textarea into a vector of bytes.
///
/// # Arguments
/// * `input` - A string read from the Communication Panel's textarea. For examples, see
/// `/tests/input_processing_test.rs`.
///
/// # Returns
/// Returns a vector of bytes or an error if the input is invalid.
pub fn process_input(input: &str) -> Result<Vec<u8>, InputError> {
    let mut result = Vec::new();
    let mut in_quote = false;
    let mut number_buffer = String::new();

    for c in input.chars() {
        match c {
            '\'' => {
                if in_quote {
                    if !number_buffer.is_empty() {
                        let num_buf_res: Vec<Result<u8, _>> = number_buffer
                            .split_whitespace()
                            .map(|s| {
                                if let Ok(byte) = if s.starts_with("0x") {
                                    u8::from_str_radix(&s[2..], 16)
                                } else {
                                    s.parse()
                                } {
                                    Ok(byte)
                                } else {
                                    Err(InputError::InvalidByteSequence(
                                        "Non-numeric character inside quote".to_string(),
                                    ))
                                }
                            })
                            .collect();
                        if num_buf_res.iter().all(|x| x.is_ok()) {
                            for byte in num_buf_res {
                                result.push(byte.unwrap());
                            }
                        } else {
                            return Err(InputError::InvalidByteSequence(
                                "Non-numeric character inside quote".to_string(),
                            ));
                        }
                        number_buffer.clear();
                    }
                }
                in_quote = !in_quote;
            }
            _ => {
                if in_quote {
                    number_buffer.push(c);
                } else {
                    result.push(c as u8);
                }
            }
        }
    }

    if in_quote {
        return Err(InputError::InvalidByteSequence(
            "Unclosed single quote".to_string(),
        ));
    }

    Ok(result)
}
