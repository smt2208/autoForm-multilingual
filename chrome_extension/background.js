/**
 * FormFiller Background Service Worker
 * Handles communication between popup and content scripts
 */

try {
  importScripts('config.js');
} catch (e) {
  console.error('Failed to import config.js:', e);
}

let processingState = {
    isProcessing: false,
    step: 'IDLE', // IDLE, ANALYZING, CRAWLING, BRAIN, FILLING, SUCCESS, ERROR
    message: ''
};

function updateState(step, message) {
    processingState = {
        isProcessing: step !== 'IDLE' && step !== 'SUCCESS' && step !== 'ERROR',
        step,
        message
    };
    chrome.runtime.sendMessage({
        action: 'STATUS_UPDATE',
        state: processingState
    }).catch(() => {});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_STATUS') {
        sendResponse(processingState);
    }
    
    if (request.action === 'startRecording') {
        console.log('Starting recording command received');
        updateState('IDLE', ''); // Reset previous state
        sendResponse({ status: 'ack' });
    }
    
    if (request.action === 'stopRecording') {
        console.log('Stopping recording command received');
        sendResponse({ status: 'ack' });
    }
    
    if (request.action === 'PROCESS_AUDIO') {
        handleAudioProcessing(request.audioBlobData, request.tabId)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // async response
    }
});

/**
 * Handle the full audio-to-form-fill pipeline in the background.
 * Runs in the service worker so it survives popup closure.
 */
async function handleAudioProcessing(audioBlobData, tabId) {
    
    try {
        updateState('ANALYZING', '🔍 Analyzing your voice...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const audioBlob = await (await fetch(audioBlobData)).blob();
        
        updateState('CRAWLING', '🐛 Crawling through the form...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await chrome.tabs.sendMessage(tabId, { action: 'extractFields' });
        const formFields = response.fields;
        
        if (!formFields || formFields.length === 0) {
            throw new Error('No form fields found on this page');
        }
        
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.webm');
        formData.append('form_data_json', JSON.stringify({ fields: formFields }));
        
        updateState('BRAIN', '🧠 Activating AI brain & Supercharging intelligence...');
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const backendUrl = CONFIG.BACKEND_URL + CONFIG.API_ENDPOINTS.process;
        
        const apiResponse = await fetch(backendUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!apiResponse.ok) {
            throw new Error(`Backend returned ${apiResponse.status}: ${apiResponse.statusText}`);
        }
        
        const result = await apiResponse.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Backend processing failed');
        }
        
        updateState('FILLING', '✏️ Precision filling in progress...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            await chrome.tabs.sendMessage(tabId, {
                action: 'fillFields',
                data: result.form_data
            });
        } catch (fillError) {
            // Fallback: inject script directly if content script messaging fails
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: (data) => {
                    Object.entries(data).forEach(([fieldId, value]) => {
                        if (!value) return;
                        const element = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
                        if (element) {
                            // Use native setters to trigger React/Angular change detection
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                            
                            if (element.tagName.toLowerCase() === 'textarea' && nativeTextAreaValueSetter) {
                                nativeTextAreaValueSetter.call(element, value);
                            } else if (nativeInputValueSetter && element.tagName.toLowerCase() !== 'select') {
                                nativeInputValueSetter.call(element, value);
                            } else {
                                element.value = value;
                            }

                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                },
                args: [result.form_data]
            });
        }
        
        updateState('SUCCESS', '🎉 All fields filled perfectly!');
        
        return result;

    } catch (error) {
        updateState('ERROR', `Error: ${error.message}`);
        throw error;
    }
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('FormFiller extension installed');
});
