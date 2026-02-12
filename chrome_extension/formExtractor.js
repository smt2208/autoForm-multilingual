/**
 * Form Field Extractor Module
 * Handles extraction of form fields from the current webpage
 */

/**
 * Walk up the DOM tree and return true if the element lives inside a
 * collapsed / hidden accordion panel, tab-panel, or similar container.
 * Covers Bootstrap 3 (.collapse without .in), Bootstrap 4/5 (.collapse
 * without .show), ARIA aria-expanded="false", and generic height:0 +
 * overflow:hidden containers.
 */
function isInsideCollapsedSection(element) {
    let ancestor = element.parentElement;
    while (ancestor && ancestor !== document.body) {
        // Bootstrap 3 collapsed panel  (has .collapse but NOT .in)
        // Bootstrap 4/5 collapsed panel (has .collapse but NOT .show)
        if (
            ancestor.classList.contains('collapse') &&
            !ancestor.classList.contains('in') &&
            !ancestor.classList.contains('show')
        ) {
            return true;
        }

        // ARIA accordion / tab pattern
        if (ancestor.getAttribute('aria-expanded') === 'false') {
            return true;
        }

        // Generic CSS accordion trick (height:0 + overflow:hidden)
        const cs = window.getComputedStyle(ancestor);
        if (cs.height === '0px' && cs.overflow === 'hidden') {
            return true;
        }

        // Hidden tab-panel (display:none toggled by tab JS)
        if (ancestor.getAttribute('role') === 'tabpanel' && cs.display === 'none') {
            return true;
        }

        ancestor = ancestor.parentElement;
    }
    return false;
}

function extractFormFields() {
    const formFields = [];
    const seenFields = new Set();
    
    const elements = document.querySelectorAll('input, select, textarea');
    
    elements.forEach((element, index) => {
        const type = element.type?.toLowerCase() || 'text';
        // Skip non-fillable input types
        if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'image') {
            return;
        }

        // ── Skip fields inside collapsed accordion sections / hidden tabs ──
        // Only fields in the currently visible/expanded panel are extracted,
        // so the LLM never sees duplicate Nationality / District / Name fields
        // from other accordion sections.
        if (isInsideCollapsedSection(element)) {
            return;
        }
        
        const style = window.getComputedStyle(element);
        const isSelect2Hidden = element.classList.contains('select2-hidden-accessible');
        // Skip hidden elements unless they're Select2 hidden fields
        if (!isSelect2Hidden) {
            if (style.display === 'none' || style.visibility === 'hidden' || element.offsetParent === null) {
                return;
            }
        }
        
        // --- Group radio buttons by name into a single field with options ---
        if (type === 'radio' && element.name) {
            const groupKey = 'radiogroup_' + element.name;
            if (seenFields.has(groupKey)) return;
            seenFields.add(groupKey);
            
            const groupRadios = document.querySelectorAll(`input[type="radio"][name="${element.name}"]`);
            const options = [];
            let selectedOption = '';
            
            groupRadios.forEach(radio => {
                let optLabel = '';
                if (radio.id) {
                    const lbl = document.querySelector(`label[for="${radio.id}"]`);
                    if (lbl) optLabel = lbl.textContent.trim();
                }
                if (!optLabel && radio.nextElementSibling && radio.nextElementSibling.tagName === 'LABEL') {
                    optLabel = radio.nextElementSibling.textContent.trim();
                }
                if (!optLabel) {
                    const parentLbl = radio.closest('label');
                    if (parentLbl) {
                        optLabel = Array.from(parentLbl.childNodes)
                            .filter(n => n.nodeType === Node.TEXT_NODE)
                            .map(n => n.textContent.trim())
                            .filter(t => t.length > 0)
                            .join(' ');
                    }
                }
                if (!optLabel) optLabel = radio.value || radio.id || '';
                
                if (optLabel) options.push(optLabel);
                if (radio.checked && optLabel) selectedOption = optLabel;
            });
            
            const fieldInfo = {
                id: element.name,
                name: element.name,
                type: 'radio',
                label: element.name,
                options: options
            };
            if (selectedOption) fieldInfo.currentValue = selectedOption;
            
            formFields.push(fieldInfo);
            return;
        }
        
        const fieldId = element.id || 
                       element.name || 
                       element.getAttribute('data-testid') || 
                       element.getAttribute('data-field') ||
                       element.getAttribute('data-automation-id') ||
                       element.getAttribute('aria-labelledby') ||
                       `field_${index}`;
        
        if (seenFields.has(fieldId)) {
            return;
        }
        seenFields.add(fieldId);
        
        const fieldName = element.name || element.id || element.getAttribute('data-testid') || fieldId;
        const fieldType = element.tagName.toLowerCase() === 'select' ? 'select' : 
                         element.tagName.toLowerCase() === 'textarea' ? 'textarea' : type;
        
        // Label detection: try label[for], aria-labelledby, parent label, sibling, placeholder, and ancestor container
        let labelText = '';
        
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                labelText = label.textContent.trim();
            }
        }
        
        if (!labelText) {
            const ariaLabelledBy = element.getAttribute('aria-labelledby');
            if (ariaLabelledBy) {
                const labelElement = document.getElementById(ariaLabelledBy);
                if (labelElement) {
                    labelText = labelElement.textContent.trim();
                }
            }
        }
        
        if (!labelText) {
            const parentLabel = element.closest('label');
            if (parentLabel) {
                labelText = Array.from(parentLabel.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(text => text.length > 0)
                    .join(' ');
            }
        }
        
        if (!labelText && type === 'checkbox') {
            const nextLabel = element.nextElementSibling;
            if (nextLabel && nextLabel.tagName === 'LABEL') {
                labelText = nextLabel.textContent.trim();
            }
        }
        
        // Fallback: aria-label, placeholder, title, previous sibling, or ancestor container
        if (!labelText) {
            labelText = element.getAttribute('aria-label') || 
                       element.placeholder || 
                       element.getAttribute('title') || '';
        }
        
        if (!labelText) {
            const prevSibling = element.previousElementSibling;
            if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN' || prevSibling.tagName === 'DIV')) {
                labelText = prevSibling.textContent.trim();
            }
        }
        
        if (!labelText) {
            const parent = element.closest('div[class*="field"], div[class*="form-group"], div[class*="input"]');
            if (parent) {
                const labelInParent = parent.querySelector('label, span[class*="label"]');
                if (labelInParent) {
                    labelText = labelInParent.textContent.trim();
                }
            }
        }
        
        // Capture options for select elements (truncate large lists to save tokens)
        let options = [];
        if (fieldType === 'select') {
            options = Array.from(element.options)
                .filter(opt => opt.value)
                .map(opt => opt.text.trim());
        }
        
        // Capture current value
        let currentValue = element.value || '';
        if (type === 'checkbox' || type === 'radio') {
            currentValue = element.checked ? 'checked' : 'unchecked';
        }
        
        const fieldInfo = {
            id: fieldId,
            name: fieldName,
            type: fieldType,
            label: labelText
        };
        
        // Only include non-empty optional properties to reduce payload size
        if (element.placeholder) fieldInfo.placeholder = element.placeholder;
        if (currentValue && currentValue !== 'unchecked') fieldInfo.currentValue = currentValue;
        
        if (options.length > 0) {
            if (options.length > 10) {
                fieldInfo.options = options.slice(0, 5);
                fieldInfo.optionCount = options.length;
            } else {
                fieldInfo.options = options;
            }
        }
        
        if (element.classList.contains('select2-hidden-accessible')) {
            fieldInfo.isSelect2 = true;
        }
        
        formFields.push(fieldInfo);
    });
    
    return formFields;
}

export { extractFormFields };
