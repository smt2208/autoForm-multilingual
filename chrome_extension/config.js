/**
 * Configuration for FormFiller Extension
 * Portable across different installations
 */

const CONFIG = {
    // Backend API endpoint
    // Local development: 'http://localhost:8000'
    // Azure production:  'https://formfiller-backend-dqaehcc5eaevfscs.southindia-01.azurewebsites.net'
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
