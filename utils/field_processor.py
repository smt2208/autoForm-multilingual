"""
Utility functions for processing and normalizing form field data
"""


# Boolean-like values that open source models may produce
_TRUE_VARIANTS = {'true', 'yes', '1', 'on', 'checked', 'check', 'selected', 'agree', 'agreed'}
_FALSE_VARIANTS = {'false', 'no', '0', 'off', 'unchecked', 'uncheck', 'unselected', 'disagree'}


def _normalize_bool(value: str) -> str | None:
    """Normalize various boolean representations. Returns 'true'/'false' or None if not boolean."""
    v = value.strip().lower()
    if v in _TRUE_VARIANTS:
        return 'true'
    if v in _FALSE_VARIANTS:
        return 'false'
    return None


def post_process_fields(fields: dict) -> dict:
    """
    Post-process extracted fields to ensure correct formatting
    
    Args:
        fields: Dictionary of field names to values
        
    Returns:
        Cleaned and normalized dictionary of fields
    """
    cleaned = {}
    for key, value in fields.items():
        # Strict filtering of empty/invalid values
        if value is None:
            continue
        
        # Handle non-string values (booleans, ints from weaker models)
        if isinstance(value, bool):
            value = 'true' if value else 'false'
        elif isinstance(value, (int, float)):
            value = str(value)
        
        if isinstance(value, str):
            value = value.strip()
            if value == "" or value.lower() in ["none", "null", "n/a"]:
                continue
            
        # Normalize email fields to lowercase
        if 'email' in key.lower() and isinstance(value, str):
            value = value.lower().replace(' ', '')
        
        # Clean up phone numbers - also handle 'mobile' in key
        elif ('phone' in key.lower() or 'mobile' in key.lower()) and isinstance(value, str):
            value = ''.join(filter(str.isdigit, value))
        
        # Normalize gender to lowercase
        elif 'gender' in key.lower() and isinstance(value, str):
            value = value.lower().strip()
            if value in ['m', 'man', 'boy']:
                value = 'male'
            elif value in ['f', 'woman', 'girl']:
                value = 'female'
        
        # Normalize checkbox-like fields (keys with 'check' in name)
        elif 'check' in key.lower() and isinstance(value, str):
            normalized = _normalize_bool(value)
            if normalized is not None:
                value = normalized
        
        cleaned[key] = value
    
    return cleaned
