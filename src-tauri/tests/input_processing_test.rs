#[cfg(test)]
mod tests {
    use tinymesh_cc_tool::input_processing::{process_input, InputError};
    #[test]
    fn test_invalid_byte_sequence_1() {
        let input = "hello 'world' 0x41";
        assert_eq!(process_input(input), Err(InputError::InvalidByteSequence("Non-numeric character inside quote".to_string())));
    }

    #[test]
    fn test_invalid_byte_sequence_2() {
        let input = "hello 'world' 0xG";
        assert_eq!(process_input(input), Err(InputError::InvalidByteSequence("Non-numeric character inside quote".to_string())));
    }

    #[test]
    fn test_unclosed_quote() {
        let input = "hello 'world"; // Unclosed single quote
        assert_eq!(process_input(input), Err(InputError::InvalidByteSequence("Unclosed single quote".to_string())));
    }

    #[test]
    fn test_invalid_byte_sequence_in_quotes_1() {
        let input = "hello '0xffad'"; // Unclosed single quote
        assert_eq!(process_input(input), Err(InputError::InvalidByteSequence("Non-numeric character inside quote".to_string())));
    }
    
    #[test]
    fn test_invalid_byte_sequence_in_quotes_2() {
        let input = "hello '256'"; // Unclosed single quote
        assert_eq!(process_input(input), Err(InputError::InvalidByteSequence("Non-numeric character inside quote".to_string())));
    }

    #[test]
    fn test_valid_sequence() {
        let input = "hello world!";
        assert_eq!(process_input(input), Ok(vec![104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33]));
    }

    #[test]
    fn test_valid_sequence_with_single_quotes() {
        let input = "hello '0x58 0x59'!";
        assert_eq!(process_input(input), Ok(vec![104, 101, 108, 108, 111, 32, 0x58, 0x59, 33]));
    }

    #[test]
    fn test_valid_sequence_with_single_quotes_decimal_numbers() {
        let input = "hello '58 59'!";
        assert_eq!(process_input(input), Ok(vec![104, 101, 108, 108, 111, 32, 58, 59, 33]));
    }
}