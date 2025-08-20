// Conversion utility functions

/**
 * Convert frequency to wavelength and related parameters
 */
function convertFreqToWavelength() {
    const frequency = parseFloat(document.getElementById('conv-freq').value);
    const freqUnit = document.getElementById('conv-freq-unit').value;
    const medium = document.getElementById('conv-medium').value;
    
    if (!validateInput(frequency)) {
        showError('conv-freq', 'Please enter a valid frequency');
        return;
    }
    
    clearError('conv-freq');
    
    // Get velocity factor
    let velocityFactor = 1.0;
    switch (medium) {
        case 'air': velocityFactor = 1.0; break;
        case 'coax': velocityFactor = CONSTANTS.DEFAULTS.COAX_VF; break;
        case 'custom': velocityFactor = parseFloat(document.getElementById('conv-vf').value) || 1.0; break;
    }
    
    try {
        const wavelength = frequencyToWavelength(frequency, freqUnit, velocityFactor);
        
        // Convert to different units
        const results = {
            meters: wavelength,
            cm: wavelength * 100,
            mm: wavelength * 1000,
            feet: wavelength / CONSTANTS.LENGTH_UNITS.ft,
            inches: wavelength / CONSTANTS.LENGTH_UNITS.inches
        };
        
        // Calculate common fractions
        const halfWave = wavelength / 2;
        const quarterWave = wavelength / 4;
        const fiveEighthsWave = wavelength * 5 / 8;
        
        // Get frequency in Hz for band calculation
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const band = getFrequencyBand(freqHz);
        const nearestAmateur = getNearestAmateurBand(freqHz);
        
        let html = `
            <h4>Wavelength Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Full Wavelength (λ):</strong>
                    <ul>
                        <li>${formatNumber(results.meters, 3)} m</li>
                        <li>${formatNumber(results.cm, 2)} cm</li>
                        <li>${formatNumber(results.feet, 3)} ft</li>
                        <li>${formatNumber(results.inches, 2)} in</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Half Wavelength (λ/2):</strong>
                    <ul>
                        <li>${formatNumber(halfWave, 3)} m</li>
                        <li>${formatNumber(halfWave * 100, 2)} cm</li>
                        <li>${formatNumber(halfWave / CONSTANTS.LENGTH_UNITS.ft, 3)} ft</li>
                        <li>${formatNumber(halfWave / CONSTANTS.LENGTH_UNITS.inches, 2)} in</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Quarter Wavelength (λ/4):</strong>
                    <ul>
                        <li>${formatNumber(quarterWave, 3)} m</li>
                        <li>${formatNumber(quarterWave * 100, 2)} cm</li>
                        <li>${formatNumber(quarterWave / CONSTANTS.LENGTH_UNITS.ft, 3)} ft</li>
                        <li>${formatNumber(quarterWave / CONSTANTS.LENGTH_UNITS.inches, 2)} in</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>5/8 Wavelength:</strong>
                    <ul>
                        <li>${formatNumber(fiveEighthsWave, 3)} m</li>
                        <li>${formatNumber(fiveEighthsWave * 100, 2)} cm</li>
                        <li>${formatNumber(fiveEighthsWave / CONSTANTS.LENGTH_UNITS.ft, 3)} ft</li>
                        <li>${formatNumber(fiveEighthsWave / CONSTANTS.LENGTH_UNITS.inches, 2)} in</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Frequency Band:</strong> ${band}</p>
                <p><strong>Medium:</strong> ${medium === 'air' ? 'Free Space/Air' : medium === 'coax' ? `Coax (VF=${velocityFactor})` : `Custom (VF=${velocityFactor})`}</p>`;
        
        if (nearestAmateur) {
            html += `<p><strong>Nearest Amateur Band:</strong> ${nearestAmateur.name} (${nearestAmateur.freq} MHz, Δ${formatNumber(nearestAmateur.difference, 2)} MHz)</p>`;
        }
        
        html += '</div>';
        
        document.getElementById('freq-wavelength-results').innerHTML = html;
        
        // Update the wavelength input field
        document.getElementById('conv-wavelength').value = formatNumber(wavelength, 4);
        
    } catch (error) {
        document.getElementById('freq-wavelength-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Convert wavelength to frequency
 */
function convertWavelengthToFreq() {
    const wavelength = parseFloat(document.getElementById('conv-wavelength').value);
    const lengthUnit = document.getElementById('conv-wavelength-unit').value;
    const medium = document.getElementById('conv-medium').value;
    
    if (!validateInput(wavelength)) {
        showError('conv-wavelength', 'Please enter a valid wavelength');
        return;
    }
    
    clearError('conv-wavelength');
    
    // Get velocity factor
    let velocityFactor = 1.0;
    switch (medium) {
        case 'air': velocityFactor = 1.0; break;
        case 'coax': velocityFactor = CONSTANTS.DEFAULTS.COAX_VF; break;
        case 'custom': velocityFactor = parseFloat(document.getElementById('conv-vf').value) || 1.0; break;
    }
    
    try {
        const frequency = wavelengthToFrequency(wavelength, lengthUnit, velocityFactor);
        
        // Convert to different units
        const results = {
            Hz: frequency,
            kHz: frequency / 1e3,
            MHz: frequency / 1e6,
            GHz: frequency / 1e9
        };
        
        const band = getFrequencyBand(frequency);
        const nearestAmateur = getNearestAmateurBand(frequency);
        
        let html = `
            <h4>Frequency Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Frequency:</strong>
                    <ul>
                        <li>${formatNumber(results.Hz, 0)} Hz</li>
                        <li>${formatNumber(results.kHz, 3)} kHz</li>
                        <li>${formatNumber(results.MHz, 6)} MHz</li>
                        <li>${formatNumber(results.GHz, 9)} GHz</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Frequency Band:</strong> ${band}</p>
                <p><strong>Medium:</strong> ${medium === 'air' ? 'Free Space/Air' : medium === 'coax' ? `Coax (VF=${velocityFactor})` : `Custom (VF=${velocityFactor})`}</p>`;
        
        if (nearestAmateur) {
            html += `<p><strong>Nearest Amateur Band:</strong> ${nearestAmateur.name} (${nearestAmateur.freq} MHz, Δ${formatNumber(nearestAmateur.difference, 2)} MHz)</p>`;
        }
        
        html += '</div>';
        
        document.getElementById('freq-wavelength-results').innerHTML = html;
        
        // Update the frequency input field
        const bestFreqUnit = results.MHz > 0.1 && results.MHz < 1000 ? 'MHz' : 
                           results.kHz > 0.1 && results.kHz < 1000 ? 'kHz' :
                           results.GHz > 0.1 ? 'GHz' : 'Hz';
        
        document.getElementById('conv-freq').value = formatNumber(results[bestFreqUnit], 6);
        document.getElementById('conv-freq-unit').value = bestFreqUnit;
        
    } catch (error) {
        document.getElementById('freq-wavelength-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Convert power between all units
 */
function convertPower() {
    const power = parseFloat(document.getElementById('power-input').value);
    const inputUnit = document.getElementById('power-input-unit').value;
    
    if (!validateInput(power)) {
        showError('power-input', 'Please enter a valid power value');
        return;
    }
    
    clearError('power-input');
    
    try {
        // Convert to all units
        const watts = convertPower(power, inputUnit, 'W');
        const mW = convertPower(power, inputUnit, 'mW');
        const kW = convertPower(power, inputUnit, 'kW');
        const dBm = convertPower(power, inputUnit, 'dBm');
        const dBW = convertPower(power, inputUnit, 'dBW');
        
        let html = `
            <h4>Power Conversion Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Linear Power:</strong>
                    <ul>
                        <li>${formatNumber(watts, 6)} W</li>
                        <li>${formatNumber(mW, 3)} mW</li>
                        <li>${formatNumber(kW, 9)} kW</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Logarithmic Power:</strong>
                    <ul>
                        <li>${formatNumber(dBm, 2)} dBm</li>
                        <li>${formatNumber(dBW, 2)} dBW</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Input:</strong> ${formatNumber(power, 3)} ${inputUnit}</p>
                <p><strong>Note:</strong> dBm is referenced to 1 mW, dBW is referenced to 1 W</p>
            </div>`;
        
        document.getElementById('power-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('power-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate field strength and power density
 */
function calculateFieldStrength() {
    const power = parseFloat(document.getElementById('field-power').value);
    const powerUnit = document.getElementById('field-power-unit').value;
    const gain = parseFloat(document.getElementById('field-gain').value) || 0;
    const gainUnit = document.getElementById('field-gain-unit').value;
    const distance = parseFloat(document.getElementById('field-distance').value);
    const distanceUnit = document.getElementById('field-distance-unit').value;
    const frequency = parseFloat(document.getElementById('field-freq').value);
    const freqUnit = document.getElementById('field-freq-unit').value;
    
    if (!validateInput(power)) {
        showError('field-power', 'Please enter a valid power value');
        return;
    }
    
    if (!validateInput(distance)) {
        showError('field-distance', 'Please enter a valid distance');
        return;
    }
    
    clearError('field-power');
    clearError('field-distance');
    
    try {
        // Convert to standard units
        const powerWatts = convertPower(power, powerUnit, 'W');
        const gainLinear = convertGain(gain, gainUnit, 'linear');
        const distanceM = convertUnits(distance, distanceUnit, 'm', CONSTANTS.LENGTH_UNITS);
        
        // Calculate EIRP
        const eirpWatts = powerWatts * gainLinear;
        const eirpDbm = convertPower(eirpWatts, 'W', 'dBm');
        const eirpDbw = convertPower(eirpWatts, 'W', 'dBW');
        
        // Calculate power density (W/m²)
        const powerDensity = eirpWatts / (4 * Math.PI * distanceM * distanceM);
        const powerDensityDbm = 10 * Math.log10(powerDensity * 1000); // dBm/m²
        
        // Calculate field strength if frequency is provided
        let electricField = null;
        let magneticField = null;
        
        if (frequency && validateInput(frequency)) {
            // E = sqrt(30 * P * G) / d  where P is in watts, G is linear gain, d is in meters
            electricField = Math.sqrt(30 * eirpWatts) / distanceM; // V/m
            magneticField = electricField / CONSTANTS.FREE_SPACE_IMPEDANCE; // A/m
        }
        
        let html = `
            <h4>Field Strength Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>EIRP:</strong>
                    <ul>
                        <li>${formatNumber(eirpWatts, 6)} W</li>
                        <li>${formatNumber(eirpDbm, 2)} dBm</li>
                        <li>${formatNumber(eirpDbw, 2)} dBW</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Power Density @ ${formatNumber(distanceM, 2)} m:</strong>
                    <ul>
                        <li>${formatNumber(powerDensity, 6, true)} W/m²</li>
                        <li>${formatNumber(powerDensityDbm, 2)} dBm/m²</li>
                        <li>${formatNumber(powerDensity * 10000, 3)} mW/cm²</li>
                    </ul>
                </div>`;
        
        if (electricField !== null) {
            html += `
                <div class="result-item">
                    <strong>Electric Field:</strong>
                    <ul>
                        <li>${formatNumber(electricField, 6)} V/m</li>
                        <li>${formatNumber(electricField * 1000, 3)} mV/m</li>
                        <li>${formatNumber(20 * Math.log10(electricField), 2)} dBμV/m</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Magnetic Field:</strong>
                    <ul>
                        <li>${formatNumber(magneticField, 9, true)} A/m</li>
                        <li>${formatNumber(magneticField * 1000000, 3)} μA/m</li>
                    </ul>
                </div>`;
        }
        
        html += `
            </div>
            
            <div class="info-section">
                <p><strong>Assumptions:</strong> Far-field conditions, isotropic spreading, no atmospheric losses</p>
                <p><strong>Input Power:</strong> ${formatNumber(power, 3)} ${powerUnit}</p>
                <p><strong>Antenna Gain:</strong> ${formatNumber(gain, 1)} ${gainUnit}</p>`;
        
        if (frequency) {
            const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
            html += `<p><strong>Frequency:</strong> ${formatNumber(frequency, 3)} ${freqUnit} (${getFrequencyBand(freqHz)} band)</p>`;
        }
        
        html += '</div>';
        
        document.getElementById('field-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('field-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Handle medium selection change for frequency/wavelength conversion
 */
function handleMediumChange() {
    const medium = document.getElementById('conv-medium').value;
    const vfGroup = document.getElementById('conv-vf-group');
    
    if (medium === 'custom') {
        vfGroup.style.display = 'block';
    } else {
        vfGroup.style.display = 'none';
    }
}

/**
 * Calculate power conversions
 */
function calculatePowerConversions() {
    const power = parseFloat(document.getElementById('conv-power').value);
    const fromUnit = document.getElementById('conv-power-from').value;
    const toUnit = document.getElementById('conv-power-to').value;
    
    if (isNaN(power)) {
        showError('power-conversions', 'Please enter a valid power value');
        return;
    }
    
    try {
        // Convert to base unit (Watts)
        let watts;
        switch (fromUnit) {
            case 'mW':
                watts = power / 1000;
                break;
            case 'W':
                watts = power;
                break;
            case 'kW':
                watts = power * 1000;
                break;
            case 'dBm':
                watts = Math.pow(10, (power - 30) / 10);
                break;
            case 'dBW':
                watts = Math.pow(10, power / 10);
                break;
            default:
                watts = power;
        }
        
        // Convert from base unit to target
        let result;
        switch (toUnit) {
            case 'mW':
                result = watts * 1000;
                break;
            case 'W':
                result = watts;
                break;
            case 'kW':
                result = watts / 1000;
                break;
            case 'dBm':
                result = 10 * Math.log10(watts * 1000);
                break;
            case 'dBW':
                result = 10 * Math.log10(watts);
                break;
            default:
                result = watts;
        }
        
        document.getElementById('conv-power-result').innerHTML = `
            <div class="result-value">${formatNumber(result, 6)} ${toUnit}</div>
            <div class="result-details">
                <div>Linear power: ${formatNumber(watts, 6)} W</div>
                <div>In dBm: ${formatNumber(10 * Math.log10(watts * 1000), 2)} dBm</div>
                <div>In dBW: ${formatNumber(10 * Math.log10(watts), 2)} dBW</div>
            </div>
        `;
        
        clearError('power-conversions');
        
    } catch (error) {
        showError('power-conversions', 'Error in power conversion: ' + error.message);
    }
}

/**
 * Calculate field strength conversions
 */
function calculateFieldStrengthConversions() {
    const value = parseFloat(document.getElementById('conv-field').value);
    const fromUnit = document.getElementById('conv-field-from').value;
    const toUnit = document.getElementById('conv-field-to').value;
    const impedance = parseFloat(document.getElementById('conv-impedance').value) || 377; // Free space impedance
    
    if (isNaN(value)) {
        showError('field-conversions', 'Please enter a valid field strength value');
        return;
    }
    
    try {
        // Convert to base unit (V/m)
        let vmeter;
        switch (fromUnit) {
            case 'V/m':
                vmeter = value;
                break;
            case 'mV/m':
                vmeter = value / 1000;
                break;
            case 'μV/m':
                vmeter = value / 1000000;
                break;
            case 'dBμV/m':
                vmeter = Math.pow(10, value / 20) / 1000000;
                break;
            case 'dBmV/m':
                vmeter = Math.pow(10, value / 20) / 1000;
                break;
            case 'dBV/m':
                vmeter = Math.pow(10, value / 20);
                break;
            default:
                vmeter = value;
        }
        
        // Convert from base unit to target
        let result;
        switch (toUnit) {
            case 'V/m':
                result = vmeter;
                break;
            case 'mV/m':
                result = vmeter * 1000;
                break;
            case 'μV/m':
                result = vmeter * 1000000;
                break;
            case 'dBμV/m':
                result = 20 * Math.log10(vmeter * 1000000);
                break;
            case 'dBmV/m':
                result = 20 * Math.log10(vmeter * 1000);
                break;
            case 'dBV/m':
                result = 20 * Math.log10(vmeter);
                break;
            default:
                result = vmeter;
        }
        
        // Calculate power density
        const powerDensity = (vmeter * vmeter) / impedance; // W/m²
        
        document.getElementById('conv-field-result').innerHTML = `
            <div class="result-value">${formatNumber(result, 6)} ${toUnit}</div>
            <div class="result-details">
                <div>E-field: ${formatNumber(vmeter, 6)} V/m</div>
                <div>Power density: ${formatNumber(powerDensity * 1000, 3)} mW/m²</div>
                <div>In dBμV/m: ${formatNumber(20 * Math.log10(vmeter * 1000000), 2)} dBμV/m</div>
                <div>Impedance: ${formatNumber(impedance, 1)} Ω</div>
            </div>
        `;
        
        clearError('field-conversions');
        
    } catch (error) {
        showError('field-conversions', 'Error in field strength conversion: ' + error.message);
    }
}

/**
 * Calculate impedance conversions and relationships
 */
function calculateImpedanceConversions() {
    const real = parseFloat(document.getElementById('conv-impedance-real').value);
    const imag = parseFloat(document.getElementById('conv-impedance-imag').value) || 0;
    const refZ = parseFloat(document.getElementById('conv-ref-impedance').value) || 50;
    
    if (isNaN(real)) {
        showError('impedance-conversions', 'Please enter a valid real impedance value');
        return;
    }
    
    try {
        // Calculate complex impedance parameters
        const Z = Math.sqrt(real * real + imag * imag); // Magnitude
        const phase = Math.atan2(imag, real) * 180 / Math.PI; // Phase in degrees
        
        // Calculate reflection coefficient
        const gamma_real = (real - refZ) / (real + refZ);
        const gamma_imag = (2 * imag) / (real + refZ);
        const gamma_mag = Math.sqrt(gamma_real * gamma_real + gamma_imag * gamma_imag);
        const gamma_phase = Math.atan2(gamma_imag, gamma_real) * 180 / Math.PI;
        
        // Calculate VSWR
        const vswr = (1 + gamma_mag) / (1 - gamma_mag);
        
        // Calculate return loss
        const returnLoss = -20 * Math.log10(gamma_mag);
        
        // Calculate mismatch loss
        const mismatchLoss = -10 * Math.log10(1 - gamma_mag * gamma_mag);
        
        document.getElementById('conv-impedance-result').innerHTML = `
            <div class="result-section">
                <h4>Impedance</h4>
                <div>Magnitude: ${formatNumber(Z, 2)} Ω</div>
                <div>Phase: ${formatNumber(phase, 2)}°</div>
                <div>Complex: ${formatNumber(real, 2)} ${imag >= 0 ? '+' : ''}${formatNumber(imag, 2)}j Ω</div>
            </div>
            <div class="result-section">
                <h4>Reflection Parameters</h4>
                <div>|Γ|: ${formatNumber(gamma_mag, 4)}</div>
                <div>∠Γ: ${formatNumber(gamma_phase, 2)}°</div>
                <div>VSWR: ${formatNumber(vswr, 2)}:1</div>
                <div>Return Loss: ${formatNumber(returnLoss, 2)} dB</div>
                <div>Mismatch Loss: ${formatNumber(mismatchLoss, 3)} dB</div>
            </div>
        `;
        
        clearError('impedance-conversions');
        
    } catch (error) {
        showError('impedance-conversions', 'Error in impedance conversion: ' + error.message);
    }
}

/**
 * Calculate decibel conversions and relationships
 */
function calculateDecibelConversions() {
    const value = parseFloat(document.getElementById('conv-db-value').value);
    const type = document.getElementById('conv-db-type').value;
    
    if (isNaN(value)) {
        showError('decibel-conversions', 'Please enter a valid decibel value');
        return;
    }
    
    try {
        let linear, powerRatio, voltageRatio;
        
        switch (type) {
            case 'power':
                // Power ratio in dB
                powerRatio = value;
                linear = Math.pow(10, value / 10);
                voltageRatio = Math.sqrt(linear);
                break;
            case 'voltage':
                // Voltage ratio in dB
                voltageRatio = value;
                linear = Math.pow(10, value / 20);
                powerRatio = 2 * voltageRatio; // P = V²/R, so dB_power = 2 * dB_voltage
                break;
            case 'field':
                // Field strength ratio in dB (same as voltage)
                voltageRatio = value;
                linear = Math.pow(10, value / 20);
                powerRatio = 2 * voltageRatio;
                break;
            default:
                powerRatio = value;
                linear = Math.pow(10, value / 10);
                voltageRatio = value / 2;
        }
        
        document.getElementById('conv-db-result').innerHTML = `
            <div class="result-section">
                <h4>Linear Values</h4>
                <div>Linear ratio: ${formatNumber(linear, 6)}</div>
                <div>Percentage: ${formatNumber((linear - 1) * 100, 2)}%</div>
            </div>
            <div class="result-section">
                <h4>Decibel Values</h4>
                <div>Power ratio: ${formatNumber(powerRatio, 2)} dB</div>
                <div>Voltage ratio: ${formatNumber(voltageRatio, 2)} dB</div>
                <div>Field ratio: ${formatNumber(voltageRatio, 2)} dB</div>
            </div>
            <div class="result-section">
                <h4>Common References</h4>
                <div>Factor of 2: ${linear > 1 ? '+' : ''}${formatNumber(10 * Math.log10(2), 2)} dB</div>
                <div>Factor of 10: ${linear > 1 ? '+' : ''}${formatNumber(10 * Math.log10(10), 2)} dB</div>
                <div>3 dB point: ${formatNumber(Math.pow(10, 3/10), 3)}× (${formatNumber((Math.pow(10, 3/10) - 1) * 100, 1)}%)</div>
                <div>6 dB point: ${formatNumber(Math.pow(10, 6/10), 3)}× (${formatNumber((Math.pow(10, 6/10) - 1) * 100, 1)}%)</div>
            </div>
        `;
        
        clearError('decibel-conversions');
        
    } catch (error) {
        showError('decibel-conversions', 'Error in decibel conversion: ' + error.message);
    }
}

/**
 * Calculate temperature conversions (for noise calculations)
 */
function calculateTemperatureConversions() {
    const temp = parseFloat(document.getElementById('conv-temp-value').value);
    const fromUnit = document.getElementById('conv-temp-from').value;
    const toUnit = document.getElementById('conv-temp-to').value;
    
    if (isNaN(temp)) {
        showError('temperature-conversions', 'Please enter a valid temperature value');
        return;
    }
    
    try {
        // Convert to Kelvin first
        let kelvin;
        switch (fromUnit) {
            case 'K':
                kelvin = temp;
                break;
            case 'C':
                kelvin = temp + 273.15;
                break;
            case 'F':
                kelvin = (temp - 32) * 5/9 + 273.15;
                break;
            default:
                kelvin = temp;
        }
        
        // Convert from Kelvin to target unit
        let result;
        switch (toUnit) {
            case 'K':
                result = kelvin;
                break;
            case 'C':
                result = kelvin - 273.15;
                break;
            case 'F':
                result = (kelvin - 273.15) * 9/5 + 32;
                break;
            default:
                result = kelvin;
        }
        
        // Calculate thermal noise at room temperature (290K)
        const kT_290 = 1.38e-23 * 290; // J
        const kT_current = 1.38e-23 * kelvin; // J
        const thermalNoise_dBm_Hz = 10 * Math.log10(kT_current * 1000); // dBm/Hz
        
        document.getElementById('conv-temp-result').innerHTML = `
            <div class="result-value">${formatNumber(result, 2)} °${toUnit}</div>
            <div class="result-details">
                <div>Kelvin: ${formatNumber(kelvin, 2)} K</div>
                <div>Celsius: ${formatNumber(kelvin - 273.15, 2)} °C</div>
                <div>Fahrenheit: ${formatNumber((kelvin - 273.15) * 9/5 + 32, 2)} °F</div>
                <div>kT: ${formatNumber(kT_current * 1e21, 3)} × 10⁻²¹ J</div>
                <div>Thermal noise: ${formatNumber(thermalNoise_dBm_Hz, 1)} dBm/Hz</div>
            </div>
        `;
        
        clearError('temperature-conversions');
        
    } catch (error) {
        showError('temperature-conversions', 'Error in temperature conversion: ' + error.message);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const mediumSelect = document.getElementById('conv-medium');
    if (mediumSelect) {
        mediumSelect.addEventListener('change', handleMediumChange);
    }
});