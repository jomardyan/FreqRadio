// RF Circuit calculator functions

/**
 * Calculate LC resonance frequency and related parameters
 */
function calculateLCResonance() {
    const inductance = parseFloat(document.getElementById('lc-inductance').value);
    const lUnit = document.getElementById('lc-l-unit').value;
    const capacitance = parseFloat(document.getElementById('lc-capacitance').value);
    const cUnit = document.getElementById('lc-c-unit').value;
    
    if (!validateInput(inductance)) {
        showError('lc-inductance', 'Please enter a valid inductance');
        return;
    }
    
    if (!validateInput(capacitance)) {
        showError('lc-capacitance', 'Please enter a valid capacitance');
        return;
    }
    
    clearError('lc-inductance');
    clearError('lc-capacitance');
    
    try {
        // Convert to standard units
        const lHenries = convertUnits(inductance, lUnit, 'H', CONSTANTS.INDUCTANCE_UNITS);
        const cFarads = convertUnits(capacitance, cUnit, 'F', CONSTANTS.CAPACITANCE_UNITS);
        
        // Calculate resonant frequency
        const resonantFreq = lcResonantFrequency(lHenries, cFarads);
        
        // Calculate reactances at resonance (should be equal)
        const xl = inductiveReactance(resonantFreq, lHenries);
        const xc = capacitiveReactance(resonantFreq, cFarads);
        
        // Calculate various frequency representations
        const freqResults = {
            Hz: resonantFreq,
            kHz: resonantFreq / 1e3,
            MHz: resonantFreq / 1e6,
            GHz: resonantFreq / 1e9
        };
        
        // Get appropriate units
        const bestFreqUnit = getAppropriateUnit(resonantFreq, CONSTANTS.FREQ_UNITS, 'Hz');
        
        // Calculate wavelength
        const wavelength = frequencyToWavelength(resonantFreq, 'Hz');
        
        // Get frequency band
        const band = getFrequencyBand(resonantFreq);
        
        let html = `
            <h4>LC Resonance Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Resonant Frequency:</strong>
                    <ul>
                        <li>f₀ = ${formatNumber(bestFreqUnit.value, 6)} ${bestFreqUnit.unit}</li>
                        <li>f₀ = ${formatNumber(freqResults.Hz, 0)} Hz</li>
                        <li>f₀ = ${formatNumber(freqResults.kHz, 3)} kHz</li>
                        <li>f₀ = ${formatNumber(freqResults.MHz, 6)} MHz</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Reactances at Resonance:</strong>
                    <ul>
                        <li>X_L = ${formatNumber(xl, 2)} Ω</li>
                        <li>X_C = ${formatNumber(xc, 2)} Ω</li>
                        <li>Net reactance = ${formatNumber(xl - xc, 6)} Ω</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Component Values:</strong>
                    <ul>
                        <li>L = ${formatNumber(inductance, 3)} ${lUnit}</li>
                        <li>C = ${formatNumber(capacitance, 3)} ${cUnit}</li>
                        <li>√(L/C) = ${formatNumber(Math.sqrt(lHenries / cFarads), 2)} Ω</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Additional Info:</strong>
                    <ul>
                        <li>Wavelength: ${formatNumber(wavelength, 3)} m</li>
                        <li>Period: ${formatNumber(1 / resonantFreq * 1e9, 3)} ns</li>
                        <li>Frequency band: ${band}</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Formula:</strong> f₀ = 1 / (2π√(LC))</p>
                <p><strong>Note:</strong> At resonance, the inductive and capacitive reactances are equal and cancel out.</p>
            </div>`;
        
        document.getElementById('lc-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('lc-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate reactance of inductor or capacitor
 */
function calculateReactance() {
    const frequency = parseFloat(document.getElementById('react-freq').value);
    const freqUnit = document.getElementById('react-freq-unit').value;
    const componentType = document.getElementById('component-type').value;
    const value = parseFloat(document.getElementById('component-value').value);
    const unit = document.getElementById('component-unit').value;
    
    if (!validateInput(frequency)) {
        showError('react-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (!validateInput(value)) {
        showError('component-value', 'Please enter a valid component value');
        return;
    }
    
    clearError('react-freq');
    clearError('component-value');
    
    try {
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        let reactance, componentValueSI, formula, unitName;
        
        if (componentType === 'inductor') {
            // Convert inductance to henries
            componentValueSI = convertUnits(value, unit, 'H', CONSTANTS.INDUCTANCE_UNITS);
            reactance = inductiveReactance(freqHz, componentValueSI);
            formula = 'X_L = 2πfL';
            unitName = 'H';
        } else {
            // Convert capacitance to farads
            componentValueSI = convertUnits(value, unit, 'F', CONSTANTS.CAPACITANCE_UNITS);
            reactance = capacitiveReactance(freqHz, componentValueSI);
            formula = 'X_C = 1 / (2πfC)';
            unitName = 'F';
        }
        
        // Calculate impedance magnitude and phase
        const impedanceMag = Math.abs(reactance);
        const phase = componentType === 'inductor' ? 90 : -90;
        
        // Calculate at different frequencies for comparison
        const frequencies = [freqHz * 0.5, freqHz, freqHz * 2];
        const reactanceValues = frequencies.map(f => 
            componentType === 'inductor' ? 
                inductiveReactance(f, componentValueSI) : 
                capacitiveReactance(f, componentValueSI)
        );
        
        // Calculate resonant frequency with a hypothetical 100pF or 1µH counterpart
        let resonantInfo = '';
        if (componentType === 'inductor') {
            const testCap = 100e-12; // 100pF
            const resonantFreq = lcResonantFrequency(componentValueSI, testCap);
            resonantInfo = `<li>Resonant with 100pF: ${formatNumber(resonantFreq / 1e6, 3)} MHz</li>`;
        } else {
            const testInd = 1e-6; // 1µH
            const resonantFreq = lcResonantFrequency(testInd, componentValueSI);
            resonantInfo = `<li>Resonant with 1µH: ${formatNumber(resonantFreq / 1e6, 3)} MHz</li>`;
        }
        
        let html = `
            <h4>Reactance Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Component:</strong>
                    <ul>
                        <li>Type: ${componentType === 'inductor' ? 'Inductor' : 'Capacitor'}</li>
                        <li>Value: ${formatNumber(value, 3)} ${unit}</li>
                        <li>SI Value: ${formatNumber(componentValueSI, 6, true)} ${unitName}</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Reactance at ${formatNumber(frequency, 3)} ${freqUnit}:</strong>
                    <ul>
                        <li>|X| = ${formatNumber(impedanceMag, 2)} Ω</li>
                        <li>Phase = ${phase}°</li>
                        <li>Impedance = ${formatNumber(impedanceMag, 2)}∠${phase}° Ω</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Frequency Response:</strong>
                    <ul>
                        <li>@ ${formatNumber(frequency * 0.5, 2)} ${freqUnit}: ${formatNumber(Math.abs(reactanceValues[0]), 2)} Ω</li>
                        <li>@ ${formatNumber(frequency, 2)} ${freqUnit}: ${formatNumber(Math.abs(reactanceValues[1]), 2)} Ω</li>
                        <li>@ ${formatNumber(frequency * 2, 2)} ${freqUnit}: ${formatNumber(Math.abs(reactanceValues[2]), 2)} Ω</li>
                        ${resonantInfo}
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Formula:</strong> ${formula}</p>
                <p><strong>Note:</strong> ${componentType === 'inductor' ? 
                    'Inductive reactance increases with frequency' : 
                    'Capacitive reactance decreases with frequency'}</p>
            </div>`;
        
        document.getElementById('reactance-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('reactance-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate RLC circuit parameters
 */
function calculateRLC() {
    const resistance = parseFloat(document.getElementById('rlc-resistance').value);
    const rUnit = document.getElementById('rlc-r-unit').value;
    const inductance = parseFloat(document.getElementById('rlc-inductance').value);
    const lUnit = document.getElementById('rlc-l-unit').value;
    const capacitance = parseFloat(document.getElementById('rlc-capacitance').value);
    const cUnit = document.getElementById('rlc-c-unit').value;
    const config = document.getElementById('rlc-config').value;
    
    if (!validateInput(resistance)) {
        showError('rlc-resistance', 'Please enter a valid resistance');
        return;
    }
    
    if (!validateInput(inductance)) {
        showError('rlc-inductance', 'Please enter a valid inductance');
        return;
    }
    
    if (!validateInput(capacitance)) {
        showError('rlc-capacitance', 'Please enter a valid capacitance');
        return;
    }
    
    clearError('rlc-resistance');
    clearError('rlc-inductance');
    clearError('rlc-capacitance');
    
    try {
        // Convert to standard units
        const rOhms = convertUnits(resistance, rUnit, 'ohm', CONSTANTS.RESISTANCE_UNITS);
        const lHenries = convertUnits(inductance, lUnit, 'H', CONSTANTS.INDUCTANCE_UNITS);
        const cFarads = convertUnits(capacitance, cUnit, 'F', CONSTANTS.CAPACITANCE_UNITS);
        
        // Calculate resonant frequency
        const resonantFreq = lcResonantFrequency(lHenries, cFarads);
        
        // Calculate Q factor
        let qFactor, bandwidth3db, characteristicImpedance;
        
        if (config === 'series') {
            qFactor = seriesQFactor(rOhms, lHenries, cFarads);
            characteristicImpedance = Math.sqrt(lHenries / cFarads);
        } else {
            // Parallel configuration
            const xl = inductiveReactance(resonantFreq, lHenries);
            qFactor = rOhms / xl;
            characteristicImpedance = Math.sqrt(lHenries / cFarads);
        }
        
        bandwidth3db = resonantFreq / qFactor;
        
        // Calculate impedance at resonance
        let impedanceAtResonance;
        if (config === 'series') {
            impedanceAtResonance = rOhms; // Minimum impedance
        } else {
            impedanceAtResonance = rOhms; // Maximum impedance (parallel resonance)
        }
        
        // Calculate cutoff frequencies
        const lowerCutoff = resonantFreq - bandwidth3db / 2;
        const upperCutoff = resonantFreq + bandwidth3db / 2;
        
        // Calculate damping factor
        const dampingFactor = 1 / (2 * qFactor);
        const dampingType = qFactor < 0.5 ? 'Overdamped' : 
                           qFactor === 0.5 ? 'Critically damped' : 
                           'Underdamped';
        
        // Calculate time constants
        const timeConstant = 2 * lHenries / rOhms; // For series RL
        const ringdownTime = 2 * qFactor / (2 * Math.PI * resonantFreq);
        
        let html = `
            <h4>RLC Circuit Analysis</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Component Values:</strong>
                    <ul>
                        <li>R = ${formatNumber(resistance, 3)} ${rUnit}</li>
                        <li>L = ${formatNumber(inductance, 3)} ${lUnit}</li>
                        <li>C = ${formatNumber(capacitance, 3)} ${cUnit}</li>
                        <li>Configuration: ${config}</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Resonant Properties:</strong>
                    <ul>
                        <li>f₀ = ${formatNumber(resonantFreq / 1e6, 6)} MHz</li>
                        <li>ω₀ = ${formatNumber(2 * Math.PI * resonantFreq / 1e6, 3)} Mrad/s</li>
                        <li>Z₀ = ${formatNumber(characteristicImpedance, 2)} Ω</li>
                        <li>Z @ resonance = ${formatNumber(impedanceAtResonance, 2)} Ω</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Bandwidth & Q:</strong>
                    <ul>
                        <li>Q factor = ${formatNumber(qFactor, 2)}</li>
                        <li>3dB bandwidth = ${formatNumber(bandwidth3db / 1e3, 3)} kHz</li>
                        <li>Lower -3dB = ${formatNumber(lowerCutoff / 1e6, 6)} MHz</li>
                        <li>Upper -3dB = ${formatNumber(upperCutoff / 1e6, 6)} MHz</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Damping & Time Response:</strong>
                    <ul>
                        <li>Damping factor = ${formatNumber(dampingFactor, 3)}</li>
                        <li>Damping type: ${dampingType}</li>
                        <li>Time constant = ${formatNumber(timeConstant * 1e6, 3)} µs</li>
                        <li>Ring-down time = ${formatNumber(ringdownTime * 1e6, 3)} µs</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Configuration:</strong> ${config === 'series' ? 'Series RLC' : 'Parallel RLC'}</p>
                <p><strong>Notes:</strong></p>
                <ul>
                    <li>${config === 'series' ? 'Series resonance: minimum impedance, maximum current' : 'Parallel resonance: maximum impedance, minimum current'}</li>
                    <li>Higher Q means sharper resonance and lower bandwidth</li>
                    <li>${dampingType.toLowerCase()} response affects transient behavior</li>
                    <li>Bandwidth is inversely proportional to Q factor</li>
                </ul>
            </div>`;
        
        document.getElementById('rlc-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('rlc-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Update component unit options based on component type
 */
function updateComponentUnits() {
    const componentType = document.getElementById('component-type').value;
    const unitSelect = document.getElementById('component-unit');
    
    // Clear existing options
    unitSelect.innerHTML = '';
    
    if (componentType === 'inductor') {
        const inductanceUnits = [
            {value: 'nH', text: 'nH'},
            {value: 'uH', text: 'µH'},
            {value: 'mH', text: 'mH'},
            {value: 'H', text: 'H'}
        ];
        
        inductanceUnits.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.value;
            option.textContent = unit.text;
            if (unit.value === 'uH') option.selected = true;
            unitSelect.appendChild(option);
        });
    } else {
        const capacitanceUnits = [
            {value: 'pF', text: 'pF'},
            {value: 'nF', text: 'nF'},
            {value: 'uF', text: 'µF'},
            {value: 'mF', text: 'mF'}
        ];
        
        capacitanceUnits.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.value;
            option.textContent = unit.text;
            if (unit.value === 'pF') option.selected = true;
            unitSelect.appendChild(option);
        });
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const componentTypeSelect = document.getElementById('component-type');
    if (componentTypeSelect) {
        componentTypeSelect.addEventListener('change', updateComponentUnits);
        // Initialize units
        updateComponentUnits();
    }
});