/**
 * Configuration for FormFiller Extension
 * Portable across different installations
 */

const CONFIG = {
    // Backend API endpoint - Change this if running backend on different host/port
    BACKEND_URL: 'http://localhost:8000',
    
    // API endpoints
    API_ENDPOINTS: {
        process: '/api/process',
        health: '/health'
    },
    
    // Recording settings
    AUDIO: {
        sampleRate: 16000,
        channels: 1,
        format: 'wav'
    },
    
    // UI settings
    UI: {
        theme: 'light',
        popupWidth: 400
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
