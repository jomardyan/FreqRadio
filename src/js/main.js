// Main application initialization and coordination

// Application state
const app = {
    version: '0.1',
    initialized: false,
    currentTab: 'antenna',
    settings: {
        theme: 'light',
        autoCalculate: true,
        showGraphs: true,
        defaultUnits: {
            frequency: 'MHz',
            length: 'm',
            power: 'dBm'
        }
    }
};

/**
 * Initialize the application
 */
function initializeApp() {
    if (app.initialized) return;
    
    console.log(`FreqRadio v${app.version} initializing...`);
    
    try {
        // Load settings from localStorage
        loadAppSettings();
        
        // Initialize UI
        initializeUI();
        
        // Set up error handling
        setupErrorHandling();
        
        // Set up PWA features if supported
        setupPWA();
        
        // Load saved tab
        const savedTab = localStorage.getItem('freqradio-current-tab');
        if (savedTab) {
            showTab(savedTab);
        }
        
        app.initialized = true;
        console.log('FreqRadio initialized successfully');
        
        // Show welcome message for first-time users
        if (!localStorage.getItem('freqradio-welcomed')) {
            showWelcomeMessage();
            localStorage.setItem('freqradio-welcomed', 'true');
        }
        
    } catch (error) {
        console.error('Failed to initialize FreqRadio:', error);
        showFatalError(error);
    }
}

/**
 * Load application settings
 */
function loadAppSettings() {
    const saved = localStorage.getItem('freqradio-settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            app.settings = { ...app.settings, ...settings };
        } catch (e) {
            console.warn('Could not load app settings:', e);
        }
    }
}

/**
 * Save application settings
 */
function saveAppSettings() {
    localStorage.setItem('freqradio-settings', JSON.stringify(app.settings));
}

/**
 * Set up error handling
 */
function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        showError('global', 'An unexpected error occurred. Please refresh the page.');
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        event.preventDefault();
    });
}

/**
 * Set up Progressive Web App features
 */
function setupPWA() {
    // Service worker registration (if supported)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    // Install prompt handling
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    // Handle app install
    window.addEventListener('appinstalled', () => {
        console.log('FreqRadio was installed');
        deferredPrompt = null;
    });
}

/**
 * Show install prompt for PWA
 */
function showInstallPrompt() {
    // Create install button (optional)
    const installBtn = document.createElement('button');
    installBtn.textContent = '📱 Install App';
    installBtn.className = 'btn btn-install';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1000';
    
    installBtn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install prompt outcome:', outcome);
            deferredPrompt = null;
            installBtn.remove();
        }
    };
    
    document.body.appendChild(installBtn);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (installBtn.parentElement) {
            installBtn.remove();
        }
    }, 10000);
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    const welcome = document.createElement('div');
    welcome.className = 'welcome-message';
    welcome.innerHTML = `
        <div class="welcome-content">
            <h2>Welcome to FreqRadio! 📡</h2>
            <p>An educational RF and antenna calculator for students, hobbyists, and engineers.</p>
            <ul>
                <li>Calculate antenna dimensions and properties</li>
                <li>Analyze RF circuits and impedance matching</li>
                <li>Model transmission line parameters</li>
                <li>Estimate propagation and link budgets</li>
                <li>Convert between units and visualize data</li>
            </ul>
            <p><strong>Disclaimer:</strong> This tool provides first-order estimates for educational purposes. Always validate designs with proper measurements and simulations.</p>
            <button onclick="closeWelcome()" class="btn">Get Started</button>
        </div>
    `;
    
    welcome.style.position = 'fixed';
    welcome.style.top = '0';
    welcome.style.left = '0';
    welcome.style.width = '100%';
    welcome.style.height = '100%';
    welcome.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    welcome.style.display = 'flex';
    welcome.style.alignItems = 'center';
    welcome.style.justifyContent = 'center';
    welcome.style.zIndex = '2000';
    
    document.body.appendChild(welcome);
    
    // Global function to close welcome
    window.closeWelcome = () => {
        welcome.remove();
        delete window.closeWelcome;
    };
}

/**
 * Show fatal error
 * @param {Error} error - Error object
 */
function showFatalError(error) {
    document.body.innerHTML = `
        <div style="padding: 20px; text-align: center; color: red;">
            <h1>FreqRadio - Fatal Error</h1>
            <p>The application failed to initialize properly.</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Please refresh the page or contact support if the problem persists.</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
                Refresh Page
            </button>
        </div>
    `;
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    const required = {
        'localStorage': typeof Storage !== 'undefined',
        'JSON': typeof JSON !== 'undefined',
        'Math functions': typeof Math.log10 === 'function',
        'ES6 features': typeof Promise !== 'undefined'
    };
    
    const missing = [];
    Object.entries(required).forEach(([feature, supported]) => {
        if (!supported) {
            missing.push(feature);
        }
    });
    
    if (missing.length > 0) {
        alert(`Your browser is missing required features: ${missing.join(', ')}. Please update your browser.`);
        return false;
    }
    
    return true;
}

/**
 * Update URL with current state (for bookmarking)
 */
function updateURL() {
    const url = new URL(window.location);
    url.searchParams.set('tab', app.currentTab);
    url.searchParams.set('theme', app.settings.theme);
    window.history.replaceState({}, '', url.toString());
}

/**
 * Load state from URL parameters
 */
function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    const tab = params.get('tab');
    if (tab) {
        app.currentTab = tab;
        showTab(tab);
    }
    
    const theme = params.get('theme');
    if (theme && ['light', 'dark'].includes(theme)) {
        currentTheme = theme;
        applyTheme(theme);
    }
}

/**
 * Handle sharing functionality
 */
function shareConfiguration() {
    const config = {
        tab: app.currentTab,
        theme: app.settings.theme,
        timestamp: Date.now(),
        version: app.version
    };
    
    // Add current form data
    const formData = {};
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const inputs = activeTab.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.id && input.value) {
                formData[input.id] = input.value;
            }
        });
    }
    config.data = formData;
    
    // Create shareable URL
    const encoded = btoa(JSON.stringify(config));
    const shareURL = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'FreqRadio Configuration',
            text: 'Check out this RF calculator configuration',
            url: shareURL
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareURL).then(() => {
            alert('Configuration URL copied to clipboard!');
        });
    } else {
        prompt('Copy this URL to share the configuration:', shareURL);
    }
}

/**
 * Load shared configuration
 */
function loadSharedConfiguration() {
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    
    if (configParam) {
        try {
            const config = JSON.parse(atob(configParam));
            
            // Switch to the correct tab
            if (config.tab) {
                showTab(config.tab);
            }
            
            // Apply theme
            if (config.theme) {
                currentTheme = config.theme;
                applyTheme(config.theme);
            }
            
            // Load form data
            if (config.data) {
                setTimeout(() => { // Wait for tab to load
                    Object.entries(config.data).forEach(([id, value]) => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.value = value;
                        }
                    });
                }, 100);
            }
            
            console.log('Loaded shared configuration');
        } catch (error) {
            console.error('Failed to load shared configuration:', error);
        }
    }
}

/**
 * Handle offline functionality
 */
function handleOffline() {
    const updateOnlineStatus = () => {
        const status = navigator.onLine ? 'online' : 'offline';
        document.body.classList.toggle('offline', !navigator.onLine);
        
        if (!navigator.onLine) {
            showNotification('You are offline. Some features may be limited.', 'warning');
        }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1500';
    notification.style.maxWidth = '300px';
    
    const colors = {
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.style.color = 'white';
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    // Click to dismiss
    notification.onclick = () => notification.remove();
}

/**
 * Performance monitoring
 */
function setupPerformanceMonitoring() {
    // Monitor calculation performance
    const originalFunctions = [
        calculateWavelength, calculateDipole, calculateYagi, calculateLoop, calculatePatch,
        calculateLCResonance, calculateReactance, calculateRLC,
        calculateVSWR, calculateTransmissionLine, calculateMatching,
        calculateFSPL, calculateLinkBudget, calculateFresnel
    ];
    
    originalFunctions.forEach(func => {
        if (typeof func === 'function') {
            const original = func;
            window[func.name] = function(...args) {
                const start = performance.now();
                const result = original.apply(this, args);
                const end = performance.now();
                
                if (end - start > 100) { // Log slow calculations
                    console.warn(`${func.name} took ${(end - start).toFixed(2)}ms`);
                }
                
                return result;
            };
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (checkBrowserCompatibility()) {
            initializeApp();
            loadFromURL();
            loadSharedConfiguration();
            handleOffline();
            setupPerformanceMonitoring();
        }
    });
} else {
    // DOM already loaded
    if (checkBrowserCompatibility()) {
        initializeApp();
        loadFromURL();
        loadSharedConfiguration();
        handleOffline();
        setupPerformanceMonitoring();
    }
}

// Export app object for debugging
window.FreqRadio = app;