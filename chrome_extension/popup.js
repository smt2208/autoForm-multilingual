// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const transcriptDiv = document.getElementById('transcript');
const errorDiv = document.getElementById('error');

// State
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;

function showError(message) {
    errorDiv.textContent = `Error: ${message}`;
    console.error(message);
}

function clearError() {
    errorDiv.textContent = '';
}

function updateStatus(text, isActive = false) {
    statusText.textContent = text;
    if (isActive) {
        statusIndicator.classList.remove('inactive');
        statusIndicator.classList.add('active');
    } else {
        statusIndicator.classList.remove('active');
        statusIndicator.classList.add('inactive');
    }
}

/**
 * Start Recording: requests mic access via content script and updates UI
 */
startBtn.addEventListener('click', async () => {
    clearError();
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'startRecording' });
        
        if (response.error) {
            throw new Error(response.error);
        }
        // Update UI
        startBtn.disabled = true;
        stopBtn.disabled = false;
        updateStatus('Recording...', true);
        transcriptDiv.textContent = 'Listening to your voice...';
        
    } catch (error) {
        showError(`Failed to start recording: ${error.message}`);
        updateStatus('Ready to record', false);
    }
});

/**
 * Stop Recording: hands audio off to background service worker for processing
 */
stopBtn.addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateStatus('Background Processing...', false);
        transcriptDiv.textContent = 'Processing continues in background. You can close this popup.';
        
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' });
        
        if (response.error) {
            throw new Error(response.error);
        }
        // Hand off to Background Service Worker
        chrome.runtime.sendMessage({
            action: 'PROCESS_AUDIO',
            audioBlobData: response.audioBlob,
            tabId: tab.id
        });
        
    } catch (error) {
        showError(`Failed to stop recording: ${error.message}`);
        updateStatus('Ready to record', false);
        transcriptDiv.textContent = '';
    }
});

/**
 * Recover UI state if popup reopens during recording or processing
 */
async function checkRecordingStatus() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;
        
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getRecordingStatus' });
        if (response && response.isRecording) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            updateStatus('Recording...', true);
            transcriptDiv.textContent = 'Recording in progress... (recovered)';
            return;
        }

        // Check processing status from Background Script
        const bgState = await chrome.runtime.sendMessage({ action: 'GET_STATUS' });
        if (bgState) {
            handleStatusUpdate(bgState);
        }

    } catch (e) {
        // Content script may not be loaded yet
        console.log('Could not check recording status:', e);
    }
}

// Listen for status updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'STATUS_UPDATE') {
        handleStatusUpdate(request.state);
    }
});

function handleStatusUpdate(state) {
    if (!state || state.step === 'IDLE') return;
    if (state.step === 'SUCCESS') {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateStatus('Completed', false);
        transcriptDiv.textContent = state.message;
    } else if (state.step === 'ERROR') {
        showError(state.message);
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateStatus('Error', false);
    } else {
        // Active processing
        startBtn.disabled = true;
        stopBtn.disabled = true;
        updateStatus('Processing...', true);
        transcriptDiv.textContent = state.message;
    }
}

// Initial check
checkRecordingStatus();

console.log('FormFiller popup loaded');
