// Main application initialization and coordination

// Application state
const app = {
    version: '0.1',
    initialized: false,
    currentTab: 'antenna',
    debug: false, // Set to true during development to enable verbose logging
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
    
    if (app.debug) console.log(`FreqRadio v${app.version} initializing...`);
    
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
        let savedTab;
        try { savedTab = localStorage.getItem('freqradio-current-tab'); } catch (_) {}
        if (savedTab) {
            showTab(savedTab);
        }
        
        app.initialized = true;
        if (app.debug) console.log('FreqRadio initialized successfully');
        
        // Show welcome message for first-time users
        let welcomed;
        try { welcomed = localStorage.getItem('freqradio-welcomed'); } catch (_) {}
        if (!welcomed) {
            showWelcomeMessage();
            try { localStorage.setItem('freqradio-welcomed', 'true'); } catch (_) {}
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
    let saved;
    try {
        saved = localStorage.getItem('freqradio-settings');
    } catch (_) {
        return;
    }
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            app.settings = { ...app.settings, ...settings };
        } catch (e) {
            if (app.debug) console.warn('Could not load app settings:', e);
        }
    }
}

/**
 * Save application settings
 */
function saveAppSettings() {
    try {
        localStorage.setItem('freqradio-settings', JSON.stringify(app.settings));
    } catch (_) {}
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

// PWA install prompt - module-level scope so showInstallPrompt can access it
let deferredPrompt = null;

/**
 * Set up Progressive Web App features
 */
function setupPWA() {
    // Service worker registration (if supported)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                if (app.debug) console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                if (app.debug) console.log('Service Worker registration failed:', error);
            });
    }
    
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    // Handle app install
    window.addEventListener('appinstalled', () => {
        if (app.debug) console.log('FreqRadio was installed');
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
            try {
                const { outcome } = await deferredPrompt.userChoice;
                if (app.debug) console.log('Install prompt outcome:', outcome);
            } catch (_) {}
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
    const container = document.createElement('div');
    container.style.cssText = 'padding:20px;text-align:center;color:red;';
    
    const h1 = document.createElement('h1');
    h1.textContent = 'FreqRadio - Fatal Error';
    
    const p1 = document.createElement('p');
    p1.textContent = 'The application failed to initialize properly.';
    
    const p2 = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Error: ';
    p2.appendChild(strong);
    p2.appendChild(document.createTextNode(error && error.message ? error.message : String(error)));
    
    const p3 = document.createElement('p');
    p3.textContent = 'Please refresh the page or contact support if the problem persists.';
    
    const btn = document.createElement('button');
    btn.textContent = 'Refresh Page';
    btn.style.cssText = 'padding:10px 20px;margin-top:20px;';
    btn.onclick = () => location.reload();
    
    container.appendChild(h1);
    container.appendChild(p1);
    container.appendChild(p2);
    container.appendChild(p3);
    container.appendChild(btn);
    
    document.body.innerHTML = '';
    document.body.appendChild(container);
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
            
            if (app.debug) console.log('Loaded shared configuration');
        } catch (error) {
            if (app.debug) console.error('Failed to load shared configuration:', error);
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
                    if (app.debug) console.warn(`${func.name} took ${(end - start).toFixed(2)}ms`);
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