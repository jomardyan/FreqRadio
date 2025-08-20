// Transmission line and matching calculator functions

/**
 * Calculate VSWR and related parameters
 */
function calculateVSWR() {
    const inputType = document.getElementById('vswr-input-type').value;
    let vswr, gamma, returnLoss, mismatchLoss;
    
    try {
        switch (inputType) {
            case 'impedances':
                const z0 = parseFloat(document.getElementById('vswr-z0').value) || 50;
                const zl = parseFloat(document.getElementById('vswr-zl').value);
                
                if (!validateInput(zl)) {
                    showError('vswr-zl', 'Please enter a valid load impedance');
                    return;
                }
                
                if (!validateInput(z0)) {
                    showError('vswr-z0', 'Please enter a valid source impedance');
                    return;
                }
                
                clearError('vswr-zl');
                clearError('vswr-z0');
                
                // Calculate reflection coefficient from impedances
                gamma = Math.abs((zl - z0) / (zl + z0));
                break;
                
            case 'vswr':
                const inputVswr = parseFloat(document.getElementById('vswr-value').value);
                if (!validateInput(inputVswr, 1)) {
                    showError('vswr-value', 'VSWR must be ≥ 1');
                    return;
                }
                clearError('vswr-value');
                gamma = vswrToGamma(inputVswr);
                break;
                
            case 'reflection':
                const inputGamma = parseFloat(document.getElementById('gamma-value').value);
                if (!validateInput(inputGamma, 0, 1)) {
                    showError('gamma-value', 'Reflection coefficient must be between 0 and 1');
                    return;
                }
                clearError('gamma-value');
                gamma = inputGamma;
                break;
                
            case 'return-loss':
                const inputRL = parseFloat(document.getElementById('rl-value').value);
                if (!validateInput(inputRL, 0)) {
                    showError('rl-value', 'Return loss must be ≥ 0 dB');
                    return;
                }
                clearError('rl-value');
                gamma = returnLossToGamma(inputRL);
                break;
                
            default:
                throw new Error('Invalid input type');
        }
        
        // Calculate all related parameters
        vswr = gammaToVSWR(gamma);
        returnLoss = gammaToReturnLoss(gamma);
        mismatchLoss = mismatchLoss(gamma);
        
        // Calculate percentage of power reflected and transmitted
        const powerReflected = gamma * gamma * 100;
        const powerTransmitted = (1 - gamma * gamma) * 100;
        
        // Calculate equivalent impedances for 50Ω system
        const zMax = 50 * vswr;
        const zMin = 50 / vswr;
        
        // Calculate voltage reflection coefficient phase (assume worst case)
        const maxVoltage = 1 + gamma;
        const minVoltage = 1 - gamma;
        
        let html = `
            <h4>VSWR & Reflection Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>VSWR & Reflection:</strong>
                    <ul>
                        <li>VSWR = ${formatNumber(vswr, 3)}:1</li>
                        <li>Reflection coefficient = ${formatNumber(gamma, 4)}</li>
                        <li>Return loss = ${formatNumber(returnLoss, 2)} dB</li>
                        <li>Mismatch loss = ${formatNumber(mismatchLoss, 3)} dB</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Power Distribution:</strong>
                    <ul>
                        <li>Power reflected = ${formatNumber(powerReflected, 2)}%</li>
                        <li>Power transmitted = ${formatNumber(powerTransmitted, 2)}%</li>
                        <li>Power loss = ${formatNumber(mismatchLoss, 3)} dB</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Voltage Standing Wave:</strong>
                    <ul>
                        <li>V_max = ${formatNumber(maxVoltage, 3)} × V_inc</li>
                        <li>V_min = ${formatNumber(minVoltage, 3)} × V_inc</li>
                        <li>V_max/V_min = ${formatNumber(vswr, 3)}</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Impedance Range (50Ω system):</strong>
                    <ul>
                        <li>Z_max = ${formatNumber(zMax, 1)} Ω</li>
                        <li>Z_min = ${formatNumber(zMin, 1)} Ω</li>
                        <li>Range: ${formatNumber(zMin, 1)} - ${formatNumber(zMax, 1)} Ω</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>VSWR Quality Assessment:</strong></p>
                <ul>`;
        
        if (vswr <= 1.2) {
            html += '<li style="color: green;">Excellent match (VSWR ≤ 1.2)</li>';
        } else if (vswr <= 1.5) {
            html += '<li style="color: orange;">Good match (VSWR ≤ 1.5)</li>';
        } else if (vswr <= 2.0) {
            html += '<li style="color: orange;">Acceptable match (VSWR ≤ 2.0)</li>';
        } else {
            html += '<li style="color: red;">Poor match (VSWR > 2.0)</li>';
        }
        
        html += `
                    <li>Power efficiency: ${formatNumber(powerTransmitted, 1)}%</li>
                    <li>Return loss: ${returnLoss > 20 ? 'Excellent' : returnLoss > 14 ? 'Good' : returnLoss > 10 ? 'Fair' : 'Poor'} (${formatNumber(returnLoss, 1)} dB)</li>
                </ul>
            </div>`;
        
        document.getElementById('vswr-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('vswr-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate transmission line parameters
 */
function calculateTransmissionLine() {
    const frequency = parseFloat(document.getElementById('tl-freq').value);
    const freqUnit = document.getElementById('tl-freq-unit').value;
    const length = parseFloat(document.getElementById('tl-length').value);
    const lengthUnit = document.getElementById('tl-length-unit').value;
    const velocityFactor = parseFloat(document.getElementById('tl-vf').value) || 0.66;
    const loss = parseFloat(document.getElementById('tl-loss').value) || 0;
    
    if (!validateInput(frequency)) {
        showError('tl-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (!validateInput(length)) {
        showError('tl-length', 'Please enter a valid length');
        return;
    }
    
    if (!validateInput(velocityFactor, 0.1, 1.0)) {
        showError('tl-vf', 'Velocity factor must be between 0.1 and 1.0');
        return;
    }
    
    clearError('tl-freq');
    clearError('tl-length');
    clearError('tl-vf');
    
    try {
        // Convert to standard units
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const lengthM = convertUnits(length, lengthUnit, 'm', CONSTANTS.LENGTH_UNITS);
        
        // Calculate wavelength in the transmission line
        const wavelengthFreespace = frequencyToWavelength(freqHz, 'Hz', 1.0);
        const wavelengthTL = frequencyToWavelength(freqHz, 'Hz', velocityFactor);
        
        // Calculate electrical length
        const electricalLengthDegrees = electricalLength(freqHz, lengthM, velocityFactor);
        const electricalLengthRadians = electricalLengthDegrees * Math.PI / 180;
        const electricalLengthWavelengths = lengthM / wavelengthTL;
        
        // Calculate phase velocity and delay
        const phaseVelocity = CONSTANTS.SPEED_OF_LIGHT * velocityFactor;
        const propagationDelay = lengthM / phaseVelocity;
        
        // Calculate loss (if provided)
        let totalLoss = 0;
        let lossPerMeter = 0;
        if (loss > 0) {
            // Loss is given in dB/100m at 1GHz, scale with frequency
            const freqGHz = freqHz / 1e9;
            lossPerMeter = loss / 100 * Math.sqrt(freqGHz); // Approximate frequency scaling
            totalLoss = lossPerMeter * lengthM;
        }
        
        // Calculate common electrical lengths
        const quarterWaveLength = wavelengthTL / 4;
        const halfWaveLength = wavelengthTL / 2;
        const threeQuarterWaveLength = wavelengthTL * 3 / 4;
        
        // Determine special cases
        let specialCase = '';
        const tolerance = 0.05; // 5% tolerance
        if (Math.abs(electricalLengthWavelengths - 0.25) < tolerance) {
            specialCase = 'Quarter-wave transformer';
        } else if (Math.abs(electricalLengthWavelengths - 0.5) < tolerance) {
            specialCase = 'Half-wave (impedance repeater)';
        } else if (Math.abs(electricalLengthWavelengths - 0.75) < tolerance) {
            specialCase = 'Three-quarter wave';
        } else if (Math.abs(electricalLengthWavelengths % 0.5) < tolerance) {
            specialCase = 'Multiple of half-wavelength';
        }
        
        let html = `
            <h4>Transmission Line Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Physical Parameters:</strong>
                    <ul>
                        <li>Physical length: ${formatNumber(length, 3)} ${lengthUnit}</li>
                        <li>Frequency: ${formatNumber(frequency, 3)} ${freqUnit}</li>
                        <li>Velocity factor: ${velocityFactor}</li>
                        <li>Phase velocity: ${formatNumber(phaseVelocity / 1e8, 3)} × 10⁸ m/s</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Wavelengths:</strong>
                    <ul>
                        <li>Free space λ: ${formatNumber(wavelengthFreespace, 3)} m</li>
                        <li>In transmission line: ${formatNumber(wavelengthTL, 3)} m</li>
                        <li>Quarter wave length: ${formatNumber(quarterWaveLength, 3)} m</li>
                        <li>Half wave length: ${formatNumber(halfWaveLength, 3)} m</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Electrical Length:</strong>
                    <ul>
                        <li>Degrees: ${formatNumber(electricalLengthDegrees, 2)}°</li>
                        <li>Radians: ${formatNumber(electricalLengthRadians, 3)} rad</li>
                        <li>Wavelengths: ${formatNumber(electricalLengthWavelengths, 4)}λ</li>
                        <li>Delay: ${formatNumber(propagationDelay * 1e9, 2)} ns</li>
                    </ul>
                </div>`;
        
        if (loss > 0) {
            html += `
                <div class="result-item">
                    <strong>Loss Analysis:</strong>
                    <ul>
                        <li>Loss spec: ${loss} dB/100m @ 1GHz</li>
                        <li>Loss @ freq: ${formatNumber(lossPerMeter * 100, 2)} dB/100m</li>
                        <li>Total loss: ${formatNumber(totalLoss, 2)} dB</li>
                        <li>Power efficiency: ${formatNumber((1 - Math.pow(10, -totalLoss/10)) * 100, 1)}%</li>
                    </ul>
                </div>`;
        }
        
        html += `
            </div>
            
            <div class="info-section">`;
        
        if (specialCase) {
            html += `<p><strong>Special Case:</strong> ${specialCase}</p>`;
        }
        
        html += `
                <p><strong>Applications:</strong></p>
                <ul>
                    <li>Quarter-wave: Impedance transformer (Z_in = Z₀²/Z_L)</li>
                    <li>Half-wave: Impedance repeater (Z_in = Z_L)</li>
                    <li>Electrical length determines impedance transformation</li>
                </ul>
                
                <p><strong>Note:</strong> Calculations assume lossless line unless loss is specified. 
                Real transmission lines have additional losses from connectors and bends.</p>
            </div>`;
        
        document.getElementById('tl-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('tl-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate L-network matching parameters
 */
function calculateMatching() {
    const frequency = parseFloat(document.getElementById('match-freq').value);
    const freqUnit = document.getElementById('match-freq-unit').value;
    const rs = parseFloat(document.getElementById('match-rs').value) || 50;
    const rl = parseFloat(document.getElementById('match-rl').value);
    const targetQ = parseFloat(document.getElementById('match-q').value);
    
    if (!validateInput(frequency)) {
        showError('match-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (!validateInput(rl)) {
        showError('match-rl', 'Please enter a valid load resistance');
        return;
    }
    
    if (!validateInput(rs)) {
        showError('match-rs', 'Please enter a valid source resistance');
        return;
    }
    
    clearError('match-freq');
    clearError('match-rl');
    clearError('match-rs');
    
    if (Math.abs(rs - rl) < 0.1) {
        document.getElementById('matching-results').innerHTML = 
            '<div class="info-section"><p>Source and load resistances are already matched - no matching network needed.</p></div>';
        return;
    }
    
    try {
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const omega = 2 * Math.PI * freqHz;
        
        // Determine which resistance is higher
        const rHigh = Math.max(rs, rl);
        const rLow = Math.min(rs, rl);
        
        // Calculate required Q for matching
        const qRequired = Math.sqrt(rHigh / rLow - 1);
        const qActual = targetQ && validateInput(targetQ) ? targetQ : qRequired;
        
        // Calculate component values for L-network
        let xp, xs; // Parallel and series reactances
        
        if (rs > rl) {
            // Step down from source to load
            xp = rs / qActual;
            xs = qActual * rl;
        } else {
            // Step up from source to load  
            xs = qActual * rs;
            xp = rl / qActual;
        }
        
        // Calculate component values
        const lSeries = Math.abs(xs) / omega;
        const cSeries = 1 / (Math.abs(xs) * omega);
        const lParallel = Math.abs(xp) / omega;
        const cParallel = 1 / (Math.abs(xp) * omega);
        
        // Calculate bandwidth
        const bandwidth = freqHz / qActual;
        
        // Determine network configuration
        let config1, config2, network1, network2;
        
        if (rs > rl) {
            // High to low impedance
            config1 = 'C parallel to source, L series to load';
            config2 = 'L parallel to source, C series to load';
            network1 = {
                parallel: { type: 'C', value: cParallel },
                series: { type: 'L', value: lSeries }
            };
            network2 = {
                parallel: { type: 'L', value: lParallel },
                series: { type: 'C', value: cSeries }
            };
        } else {
            // Low to high impedance
            config1 = 'L parallel to source, C series to load';
            config2 = 'C parallel to source, L series to load';
            network1 = {
                parallel: { type: 'L', value: lParallel },
                series: { type: 'C', value: cSeries }
            };
            network2 = {
                parallel: { type: 'C', value: cParallel },
                series: { type: 'L', value: lSeries }
            };
        }
        
        // Format component values with appropriate units
        function formatComponent(comp) {
            if (comp.type === 'L') {
                const units = getAppropriateUnit(comp.value, CONSTANTS.INDUCTANCE_UNITS, 'H');
                return `${formatNumber(units.value, 3)} ${units.unit}`;
            } else {
                const units = getAppropriateUnit(comp.value, CONSTANTS.CAPACITANCE_UNITS, 'F');
                return `${formatNumber(units.value, 3)} ${units.unit}`;
            }
        }
        
        let html = `
            <h4>L-Network Matching Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Matching Requirements:</strong>
                    <ul>
                        <li>Source: ${formatNumber(rs, 1)} Ω</li>
                        <li>Load: ${formatNumber(rl, 1)} Ω</li>
                        <li>Impedance ratio: ${formatNumber(rHigh / rLow, 2)}:1</li>
                        <li>Required Q: ${formatNumber(qRequired, 2)}</li>
                        <li>Actual Q: ${formatNumber(qActual, 2)}</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Network 1: ${config1}</strong>
                    <ul>
                        <li>Parallel: ${network1.parallel.type} = ${formatComponent(network1.parallel)}</li>
                        <li>Series: ${network1.series.type} = ${formatComponent(network1.series)}</li>
                        <li>X_parallel = ${formatNumber(xp, 1)} Ω</li>
                        <li>X_series = ${formatNumber(xs, 1)} Ω</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Network 2: ${config2}</strong>
                    <ul>
                        <li>Parallel: ${network2.parallel.type} = ${formatComponent(network2.parallel)}</li>
                        <li>Series: ${network2.series.type} = ${formatComponent(network2.series)}</li>
                        <li>X_parallel = ${formatNumber(xp, 1)} Ω</li>
                        <li>X_series = ${formatNumber(xs, 1)} Ω</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Performance:</strong>
                    <ul>
                        <li>Bandwidth: ${formatNumber(bandwidth / 1e6, 3)} MHz</li>
                        <li>Fractional BW: ${formatNumber(bandwidth / freqHz * 100, 2)}%</li>
                        <li>Q factor: ${formatNumber(qActual, 2)}</li>
                        <li>Loss: Lossless (ideal)</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Design Notes:</strong></p>
                <ul>
                    <li>Two possible L-network configurations are shown</li>
                    <li>Choose based on available components and layout constraints</li>
                    <li>Lower Q networks have broader bandwidth but may not match perfectly</li>
                    <li>Component tolerances affect matching accuracy</li>
                    <li>Practical components have finite Q, adding loss</li>
                </ul>
                
                <p><strong>Frequency:</strong> ${formatNumber(frequency, 3)} ${freqUnit} 
                (BW = ${formatNumber(bandwidth / 1e3, 1)} kHz)</p>
            </div>`;
        
        document.getElementById('matching-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('matching-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Update VSWR input fields based on input type
 */
function updateVSWRInputs() {
    const inputType = document.getElementById('vswr-input-type').value;
    const impedanceInputs = document.getElementById('vswr-impedance-inputs');
    
    // Clear all additional inputs
    const additionalInputs = document.querySelectorAll('.vswr-additional-input');
    additionalInputs.forEach(input => input.remove());
    
    // Hide impedance inputs for non-impedance types
    if (inputType === 'impedances') {
        impedanceInputs.style.display = 'block';
    } else {
        impedanceInputs.style.display = 'none';
        
        // Create appropriate input field
        const container = document.querySelector('#vswr-impedance-inputs').parentNode;
        const inputDiv = document.createElement('div');
        inputDiv.className = 'input-group vswr-additional-input';
        
        let label, inputId, unit;
        switch (inputType) {
            case 'vswr':
                label = 'VSWR';
                inputId = 'vswr-value';
                unit = ':1';
                break;
            case 'reflection':
                label = 'Reflection Coefficient (|Γ|)';
                inputId = 'gamma-value';
                unit = '';
                break;
            case 'return-loss':
                label = 'Return Loss';
                inputId = 'rl-value';
                unit = 'dB';
                break;
        }
        
        inputDiv.innerHTML = `
            <label for="${inputId}">${label}</label>
            <div class="input-with-unit">
                <input type="number" id="${inputId}" step="0.001" placeholder="Enter ${label.toLowerCase()}">
                ${unit ? `<span class="unit">${unit}</span>` : ''}
            </div>
        `;
        
        container.insertBefore(inputDiv, container.querySelector('button'));
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const vswrInputType = document.getElementById('vswr-input-type');
    if (vswrInputType) {
        vswrInputType.addEventListener('change', updateVSWRInputs);
    }
});