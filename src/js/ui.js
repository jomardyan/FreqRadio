// UI management and interaction functions

let currentTheme = 'light';
let presets = {};

/**
 * Initialize the UI
 */
function initializeUI() {
    // Load saved theme
    const savedTheme = localStorage.getItem('freqradio-theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(currentTheme);
    }
    
    // Load saved presets
    const savedPresets = localStorage.getItem('freqradio-presets');
    if (savedPresets) {
        try {
            presets = JSON.parse(savedPresets);
        } catch (e) {
            console.warn('Could not load saved presets:', e);
        }
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize first tab
    showTab('antenna');
    
    // Add keyboard navigation
    setupKeyboardNavigation();
    
    // Set up tooltips and help
    setupTooltips();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Navigation buttons
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            showTab(tabName);
        });
    });
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettings);
    }
    
    // Help button
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
    
    // Add debounced input listeners for auto-calculation
    setupAutoCalculation();
}

/**
 * Set up auto-calculation on input change
 */
function setupAutoCalculation() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(() => {
            const calculator = getCalculatorForInput(input.id);
            if (calculator) {
                // Auto-calculate after 1 second of no input
                calculator();
            }
        }, 1000));
    });
}

/**
 * Get calculator function for input field
 * @param {string} inputId - Input field ID
 * @returns {Function|null} Calculator function
 */
function getCalculatorForInput(inputId) {
    // Map input IDs to calculator functions
    const calculatorMap = {
        'freq-wavelength': calculateWavelength,
        'dipole-freq': calculateDipole,
        'yagi-freq': calculateYagi,
        'loop-freq': calculateLoop,
        'patch-freq': calculatePatch,
        'lc-inductance': calculateLCResonance,
        'lc-capacitance': calculateLCResonance,
        'react-freq': calculateReactance,
        'rlc-resistance': calculateRLC,
        'vswr-z0': calculateVSWR,
        'vswr-zl': calculateVSWR,
        'tl-freq': calculateTransmissionLine,
        'match-freq': calculateMatching,
        'fspl-freq': calculateFSPL,
        'lb-freq': calculateLinkBudget,
        'fresnel-freq': calculateFresnel,
        'conv-freq': convertFreqToWavelength,
        'power-input': convertPower,
        'field-power': calculateFieldStrength
    };
    
    return calculatorMap[inputId] || null;
}

/**
 * Show tab
 * @param {string} tabName - Tab name to show
 */
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from nav buttons
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to corresponding nav button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Save current tab
    localStorage.setItem('freqradio-current-tab', tabName);
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('freqradio-theme', currentTheme);
}

/**
 * Apply theme
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function applyTheme(theme) {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    // Update chart colors if chart is visible
    if (currentChart) {
        const isDark = theme === 'dark';
        currentChart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(128, 128, 128, 0.2)';
        currentChart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(128, 128, 128, 0.2)';
        currentChart.update();
    }
}

/**
 * Show error message for input field
 * @param {string} inputId - Input field ID
 * @param {string} message - Error message
 */
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Remove existing error
    clearError(inputId);
    
    // Add error class
    input.classList.add('error');
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.id = `${inputId}-error`;
    errorDiv.textContent = message;
    
    // Insert after input or input container
    const container = input.closest('.input-with-unit') || input;
    container.parentNode.insertBefore(errorDiv, container.nextSibling);
}

/**
 * Clear error message for input field
 * @param {string} inputId - Input field ID
 */
function clearError(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.classList.remove('error');
    }
    
    const errorMessage = document.getElementById(`${inputId}-error`);
    if (errorMessage) {
        errorMessage.remove();
    }
}

/**
 * Show settings modal
 */
function showSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    // Populate settings content
    const content = document.getElementById('settings-content');
    content.innerHTML = `
        <div class="settings-section">
            <h3>Appearance</h3>
            <label>
                <input type="radio" name="theme" value="light" ${currentTheme === 'light' ? 'checked' : ''}>
                Light Theme
            </label>
            <label>
                <input type="radio" name="theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''}>
                Dark Theme
            </label>
        </div>
        
        <div class="settings-section">
            <h3>Units</h3>
            <label>
                Default Frequency Unit:
                <select id="default-freq-unit">
                    <option value="Hz">Hz</option>
                    <option value="kHz">kHz</option>
                    <option value="MHz" selected>MHz</option>
                    <option value="GHz">GHz</option>
                </select>
            </label>
            
            <label>
                Default Length Unit:
                <select id="default-length-unit">
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="m" selected>meters</option>
                    <option value="ft">feet</option>
                    <option value="inches">inches</option>
                </select>
            </label>
        </div>
        
        <div class="settings-section">
            <h3>Calculation</h3>
            <label>
                <input type="checkbox" id="auto-calculate" checked>
                Auto-calculate on input change
            </label>
            
            <label>
                <input type="checkbox" id="show-graphs" checked>
                Show interactive graphs
            </label>
        </div>
        
        <div class="settings-section">
            <h3>Data</h3>
            <button onclick="exportSettings()" class="btn">Export Settings</button>
            <button onclick="importSettings()" class="btn">Import Settings</button>
            <button onclick="resetSettings()" class="btn btn-warning">Reset to Defaults</button>
        </div>
    `;
    
    // Set up event listeners
    const themeRadios = modal.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentTheme = e.target.value;
            applyTheme(currentTheme);
            localStorage.setItem('freqradio-theme', currentTheme);
        });
    });
    
    modal.style.display = 'block';
}

/**
 * Show help modal
 */
function showHelp() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;
    
    const content = document.getElementById('help-content');
    content.innerHTML = `
        <div class="help-section">
            <h3>Getting Started</h3>
            <p>FreqRadio is an educational RF and antenna calculator. Navigate between different calculator categories using the tabs above.</p>
            
            <h4>Calculator Categories:</h4>
            <ul>
                <li><strong>Antenna:</strong> Wavelength, dipole, Yagi, loop, and patch antenna calculations</li>
                <li><strong>RF Circuits:</strong> LC resonance, reactance, and RLC circuit analysis</li>
                <li><strong>Transmission:</strong> VSWR, transmission line parameters, and matching networks</li>
                <li><strong>Propagation:</strong> Path loss, link budgets, and Fresnel zones</li>
                <li><strong>Conversions:</strong> Frequency/wavelength, power, and field strength conversions</li>
            </ul>
        </div>
        
        <div class="help-section">
            <h3>Using the Calculators</h3>
            <ol>
                <li>Enter values in the input fields</li>
                <li>Select appropriate units from dropdown menus</li>
                <li>Click "Calculate" or wait for auto-calculation</li>
                <li>Review results and additional information</li>
                <li>Use "Plot" buttons to visualize data (where available)</li>
            </ol>
        </div>
        
        <div class="help-section">
            <h3>Tips</h3>
            <ul>
                <li>Hover over input labels for additional help</li>
                <li>Red highlighting indicates input errors</li>
                <li>Results include both theoretical and practical considerations</li>
                <li>Export results as CSV or save configurations for later</li>
                <li>Use keyboard shortcuts: Tab to navigate, Enter to calculate</li>
            </ul>
        </div>
        
        <div class="help-section">
            <h3>Limitations</h3>
            <p>This calculator provides first-order engineering estimates for educational purposes. 
            Real-world performance depends on materials, construction, environment, and other factors. 
            Always validate designs with proper measurements and simulations.</p>
        </div>
        
        <div class="help-section">
            <h3>Keyboard Shortcuts</h3>
            <ul>
                <li><code>Tab</code> - Navigate between inputs</li>
                <li><code>Enter</code> - Calculate current form</li>
                <li><code>Ctrl+1-5</code> - Switch between tabs</li>
                <li><code>Ctrl+T</code> - Toggle theme</li>
                <li><code>F1</code> - Show this help</li>
            </ul>
        </div>
    `;
    
    modal.style.display = 'block';
}

/**
 * Show about modal
 */
function showAbout() {
    alert(`FreqRadio v0.1

An educational RF and antenna calculator for students, hobbyists, and engineers.

Features:
• Antenna sizing and analysis
• RF circuit calculations
• Transmission line tools
• Propagation modeling
• Unit conversions
• Interactive plots

Created for educational purposes only.
Always validate designs with proper measurements.

© 2025 FreqRadio Project`);
}

/**
 * Close modal
 * @param {string} modalId - Modal ID to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Set up keyboard navigation
 */
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Tab switching (Ctrl+1 through Ctrl+5)
        if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const tabs = ['antenna', 'rf-circuits', 'transmission', 'propagation', 'conversions'];
            const tabIndex = parseInt(e.key) - 1;
            if (tabs[tabIndex]) {
                showTab(tabs[tabIndex]);
            }
        }
        
        // Theme toggle (Ctrl+T)
        if (e.ctrlKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Help (F1)
        if (e.key === 'F1') {
            e.preventDefault();
            showHelp();
        }
        
        // Calculate on Enter
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            const calculator = getCalculatorForInput(e.target.id);
            if (calculator) {
                calculator();
            }
        }
    });
}

/**
 * Set up tooltips
 */
function setupTooltips() {
    // Add title attributes for help
    const helpTexts = {
        'velocity-factor': 'Velocity factor: ratio of wave speed in medium to speed in free space',
        'end-effect': 'End effect: shortening due to wire thickness and end capacitance',
        'patch-substrate-er': 'Dielectric constant of substrate material (εr)',
        'patch-thickness': 'Thickness of substrate between patch and ground plane',
        'tl-vf': 'Velocity factor of transmission line (0.66 for typical coax)',
        'fresnel-freq': 'Operating frequency for Fresnel zone calculation',
        'lb-tx-gain': 'Transmit antenna gain in dBi',
        'lb-rx-gain': 'Receive antenna gain in dBi'
    };
    
    Object.entries(helpTexts).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) {
            element.title = text;
        }
    });
}

/**
 * Save preset configuration
 * @param {string} name - Preset name
 */
function savePreset(name) {
    if (!name) {
        name = prompt('Enter preset name:');
        if (!name) return;
    }
    
    // Get current form values
    const formData = {};
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id && input.value) {
            formData[input.id] = input.value;
        }
    });
    
    presets[name] = {
        data: formData,
        timestamp: Date.now(),
        tab: document.querySelector('.tab-content.active').id
    };
    
    localStorage.setItem('freqradio-presets', JSON.stringify(presets));
    alert(`Preset "${name}" saved successfully!`);
}

/**
 * Load preset configuration
 * @param {string} name - Preset name
 */
function loadPreset(name) {
    if (!presets[name]) {
        alert('Preset not found!');
        return;
    }
    
    const preset = presets[name];
    
    // Switch to correct tab
    if (preset.tab) {
        showTab(preset.tab);
    }
    
    // Load form values
    Object.entries(preset.data).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    });
    
    alert(`Preset "${name}" loaded successfully!`);
}

/**
 * Export settings and presets
 */
function exportSettings() {
    const settings = {
        theme: currentTheme,
        presets: presets,
        version: '0.1',
        timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = 'freqradio-settings.json';
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Import settings and presets
 */
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (settings.theme) {
                    currentTheme = settings.theme;
                    applyTheme(currentTheme);
                    localStorage.setItem('freqradio-theme', currentTheme);
                }
                
                if (settings.presets) {
                    presets = settings.presets;
                    localStorage.setItem('freqradio-presets', JSON.stringify(presets));
                }
                
                alert('Settings imported successfully!');
            } catch (error) {
                alert('Error importing settings: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
        return;
    }
    
    // Reset theme
    currentTheme = 'light';
    applyTheme(currentTheme);
    localStorage.removeItem('freqradio-theme');
    
    // Clear presets
    presets = {};
    localStorage.removeItem('freqradio-presets');
    
    // Clear current tab
    localStorage.removeItem('freqradio-current-tab');
    
    alert('Settings reset to defaults!');
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI);

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentChart) {
        // Pause chart animations when page is hidden
        currentChart.options.animation = false;
    } else if (!document.hidden && currentChart) {
        // Resume animations when page is visible
        currentChart.options.animation = true;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (currentChart) {
        currentChart.resize();
    }
});