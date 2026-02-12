/**
 * Form Field Filler Module
 * Handles filling form fields with provided data
 */

/**
 * Format time value to HH:MM format
 * Accepts various formats: "2:30 PM", "14:30", "230", etc.
 */
function formatTime(value) {
    if (!value) return '';
    
    const valStr = String(value).trim();
    
    // Already in HH:MM or HH:MM:SS format
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(valStr)) {
        return valStr;
    }
    
    // Handle 12-hour format with AM/PM
    const ampmMatch = valStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = ampmMatch[2] || '00';
        const period = ampmMatch[3].toUpperCase();
        
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    
    return valStr;
}

/**
 * Format date value to DD/MM/YYYY or YYYY-MM-DD format
 * Accepts various formats: "2026-01-15", "15/01/2026", "15-01-2026", etc.
 */
function formatDate(value, useISOFormat = false) {
    if (!value) return '';
    
    const valStr = String(value).trim();
    
    // Try to parse various date formats
    let day, month, year;
    
    // ISO format: YYYY-MM-DD
    const isoMatch = valStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        year = isoMatch[1];
        month = isoMatch[2].padStart(2, '0');
        day = isoMatch[3].padStart(2, '0');
        return useISOFormat ? `${year}-${month}-${day}` : `${day}/${month}/${year}`;
    }
    
    // DD/MM/YYYY or DD-MM-YYYY format
    const dmyMatch = valStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        day = dmyMatch[1].padStart(2, '0');
        month = dmyMatch[2].padStart(2, '0');
        year = dmyMatch[3];
        return useISOFormat ? `${year}-${month}-${day}` : `${day}/${month}/${year}`;
    }
    
    // MM/DD/YYYY format (US)
    const mdyMatch = valStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mdyMatch) {
        month = mdyMatch[1].padStart(2, '0');
        day = mdyMatch[2].padStart(2, '0');
        year = mdyMatch[3];
        return useISOFormat ? `${year}-${month}-${day}` : `${day}/${month}/${year}`;
    }
    
    return valStr;
}

function fillFormFields(fieldData) {
    if (!fieldData || typeof fieldData !== 'object') {
        console.error('Invalid field data:', fieldData);
        return;
    }
    
    let hasScrolled = false;
    
    Object.entries(fieldData).forEach(([fieldId, value]) => {
        if (value === null || value === undefined || value === '' || value === 'null') {
            return;
        }
        
        // Find element by id, name, data attributes, or class
        let element = document.getElementById(fieldId) || 
                     document.querySelector(`[name="${fieldId}"]`) ||
                     document.querySelector(`[data-testid="${fieldId}"]`) ||
                     document.querySelector(`[data-field="${fieldId}"]`) ||
                     document.querySelector(`[aria-labelledby="${fieldId}"]`) ||
                     document.querySelector(`.${fieldId}`);
        
        if (element) {
            // Scroll to first filled field only
            if (!hasScrolled) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                hasScrolled = true;
            }

            // --- SELECT (Dropdowns) ---
            if (element.tagName.toLowerCase() === 'select') {
                const options = Array.from(element.options);
                const valLower = String(value).toLowerCase();
                
                // Try exact value match, then text match, then partial match
                let matchingOption = options.find(opt => opt.value.toLowerCase() === valLower);
                
                if (!matchingOption) {
                    matchingOption = options.find(opt => opt.text.toLowerCase() === valLower);
                }
                
                if (!matchingOption) {
                    matchingOption = options.find(opt => opt.text.toLowerCase().includes(valLower));
                }
                
                // Word-overlap fallback for fuzzy matching
                if (!matchingOption) {
                    matchingOption = options.find(opt => opt.text.toLowerCase().includes(valLower) || valLower.includes(opt.text.toLowerCase()));
                }
                
                if (!matchingOption && valLower.length > 2) {
                    const valWords = valLower.split(/\s+/);
                    let bestMatch = null;
                    let bestScore = 0;
                    for (const opt of options) {
                        const optWords = opt.text.toLowerCase().split(/\s+/);
                        const overlap = valWords.filter(w => optWords.some(ow => ow.includes(w) || w.includes(ow))).length;
                        if (overlap > bestScore) {
                            bestScore = overlap;
                            bestMatch = opt;
                        }
                    }
                    if (bestScore > 0) matchingOption = bestMatch;
                }

                if (matchingOption) {
                    element.value = matchingOption.value;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
            
            // --- CHECKBOX & RADIO ---
            } else if (element.type === 'checkbox' || element.type === 'radio') {
                const valStr = String(value).toLowerCase();
                const isBooleanTrue = valStr === 'yes' || valStr === 'true' || valStr === '1' || valStr === 'on';
                const isBooleanFalse = valStr === 'no' || valStr === 'false' || valStr === '0' || valStr === 'off';
                
                let targetElement = element;
                
                // Handle groups: resolve target element by matching value or label text
                if (element.name || element.className) {
                    let group = element.name ? document.querySelectorAll(`input[name="${element.name}"]`) : [];
                    
                    // Fallback to class-based grouping
                    if (group.length <= 1 && element.className) {
                        const classList = element.className.split(' ').filter(c => c && c !== 'option-input' && c !== 'radio' && c !== 'checkbox');
                        for (const cls of classList) {
                            const classBased = document.querySelectorAll(`.${cls}`);
                            if (classBased.length > 1) {
                                group = classBased;
                                break;
                            }
                        }
                    }
                    
                    if (group.length > 1) {
                        let found = false;
                        
                        // Match by value attribute
                        for (const input of group) {
                            if (input.value.toLowerCase() === valStr) {
                                targetElement = input;
                                found = true;
                                break;
                            }
                        }
                        
                        // Match by associated label text
                        if (!found) {
                            for (const input of group) {
                                let labelText = '';
                                if (input.id) {
                                    const label = document.querySelector(`label[for="${input.id}"]`);
                                    if (label) labelText = label.textContent.trim().toLowerCase();
                                }
                                if (!labelText && input.nextElementSibling && input.nextElementSibling.tagName === 'LABEL') {
                                    labelText = input.nextElementSibling.textContent.trim().toLowerCase();
                                }
                                if (!labelText && input.parentElement.tagName === 'LABEL') {
                                    labelText = input.parentElement.textContent.trim().toLowerCase();
                                }
                                
                                if (labelText && (labelText === valStr || labelText.includes(valStr))) {
                                    targetElement = input;
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                // Apply the change
                if (isBooleanFalse && element.type === 'checkbox') {
                    if (targetElement.checked) {
                        targetElement.checked = false;
                        targetElement.dispatchEvent(new Event('click', { bubbles: true }));
                        targetElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                } else if (!isBooleanFalse) {
                    if (!targetElement.checked) {
                        targetElement.checked = true;
                        targetElement.dispatchEvent(new Event('click', { bubbles: true }));
                        targetElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            
            // --- TEXT INPUTS & TEXTAREA ---
            } else {
                if (element.classList.contains('timepicker') || element.id.includes('time')) {
                    element.value = formatTime(value) || value;
                } else if (element.id.includes('date') || element.type === 'date') {
                    element.value = formatDate(value, element.type === 'date') || value;
                } else {
                    element.value = value;
                }
                
                // Use native setter to trigger framework change detection (React, Angular, etc.)
                const proto = window[element.constructor.name]?.prototype;
                const nativeSetter = proto ? Object.getOwnPropertyDescriptor(proto, 'value')?.set : null;
                
                if (nativeSetter) {
                    nativeSetter.call(element, element.value);
                }
                
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('blur', { bubbles: true }));
            }
        } else {
            console.warn(`Field not found: ${fieldId}`);
        }
    });
}

export { fillFormFields };