// Antenna calculator functions

/**
 * Calculate wavelength and basic element lengths
 */
function calculateWavelength() {
    const frequency = parseFloat(document.getElementById('freq-wavelength').value);
    const freqUnit = document.getElementById('freq-unit-wavelength').value;
    const velocityFactor = parseFloat(document.getElementById('velocity-factor').value) || CONSTANTS.DEFAULTS.VELOCITY_FACTOR;
    const endEffect = parseFloat(document.getElementById('end-effect').value) || CONSTANTS.ANTENNA.END_EFFECT_PERCENT;
    
    if (!validateInput(frequency)) {
        showError('freq-wavelength', 'Please enter a valid frequency');
        return;
    }
    
    clearError('freq-wavelength');
    
    try {
        const wavelength = frequencyToWavelength(frequency, freqUnit, velocityFactor);
        
        // Apply end effect correction
        const endEffectFactor = 1 - (endEffect / 100);
        
        // Calculate various element lengths
        const halfWave = (wavelength / 2) * endEffectFactor;
        const quarterWave = (wavelength / 4) * endEffectFactor;
        const fullWave = wavelength * endEffectFactor;
        const threeQuarterWave = (wavelength * 3 / 4) * endEffectFactor;
        const fiveEighthsWave = (wavelength * 5 / 8) * endEffectFactor;
        
        // Get frequency band information
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const band = getFrequencyBand(freqHz);
        const nearestAmateur = getNearestAmateurBand(freqHz);
        
        let html = `
            <h4>Wavelength & Element Length Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Full Wavelength (λ):</strong>
                    <ul>
                        <li>Theoretical: ${formatNumber(wavelength, 3)} m</li>
                        <li>Practical: ${formatNumber(fullWave, 3)} m</li>
                        <li>Practical: ${formatNumber(fullWave / CONSTANTS.LENGTH_UNITS.ft, 3)} ft</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Half Wave Dipole (λ/2):</strong>
                    <ul>
                        <li>Length: ${formatNumber(halfWave, 3)} m</li>
                        <li>Length: ${formatNumber(halfWave / CONSTANTS.LENGTH_UNITS.ft, 3)} ft</li>
                        <li>Length: ${formatNumber(halfWave / CONSTANTS.LENGTH_UNITS.inches, 1)} in</li>
                        <li>Each element: ${formatNumber(halfWave / 2, 3)} m</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Quarter Wave Monopole (λ/4):</strong>
                    <ul>
                        <li>Length: ${formatNumber(quarterWave, 3)} m</li>
                        <li>Length: ${formatNumber(quarterWave / CONSTANTS.LENGTH_UNITS.ft, 3)} ft</li>
                        <li>Length: ${formatNumber(quarterWave / CONSTANTS.LENGTH_UNITS.inches, 1)} in</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Other Lengths:</strong>
                    <ul>
                        <li>3λ/4: ${formatNumber(threeQuarterWave, 3)} m</li>
                        <li>5λ/8: ${formatNumber(fiveEighthsWave, 3)} m</li>
                        <li>λ/8: ${formatNumber(quarterWave / 2, 3)} m</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Parameters:</strong></p>
                <ul>
                    <li>Velocity Factor: ${velocityFactor}</li>
                    <li>End Effect: ${endEffect}%</li>
                    <li>Frequency Band: ${band}</li>`;
        
        if (nearestAmateur) {
            html += `<li>Nearest Amateur Band: ${nearestAmateur.name} (${nearestAmateur.freq} MHz)</li>`;
        }
        
        html += `
                </ul>
                <p><em>Note: Practical lengths include end effect correction. Actual lengths may vary based on wire diameter, surroundings, and construction.</em></p>
            </div>`;
        
        document.getElementById('wavelength-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('wavelength-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate dipole antenna parameters
 */
function calculateDipole() {
    const frequency = parseFloat(document.getElementById('dipole-freq').value);
    const freqUnit = document.getElementById('dipole-freq-unit').value;
    const dipoleType = document.getElementById('dipole-type').value;
    const wireDiameter = parseFloat(document.getElementById('dipole-wire-diameter').value);
    const wireUnit = document.getElementById('dipole-wire-unit').value;
    
    if (!validateInput(frequency)) {
        showError('dipole-freq', 'Please enter a valid frequency');
        return;
    }
    
    clearError('dipole-freq');
    
    try {
        const wavelength = frequencyToWavelength(frequency, freqUnit, CONSTANTS.DEFAULTS.VELOCITY_FACTOR);
        
        // Calculate lengths based on type
        let totalLength, radiationResistance, directivity, gain, beamwidth;
        
        switch (dipoleType) {
            case 'halfwave':
                totalLength = wavelength / 2 * CONSTANTS.ANTENNA.DIPOLE_FACTOR;
                radiationResistance = MATH.DIPOLE_RESISTANCE;
                directivity = 1.64; // linear
                gain = 2.14; // dBi
                beamwidth = 78; // degrees
                break;
                
            case 'fullwave':
                totalLength = wavelength * CONSTANTS.ANTENNA.DIPOLE_FACTOR;
                radiationResistance = 199; // approximate for full-wave
                directivity = 2.41; // linear
                gain = 3.82; // dBi
                beamwidth = 47; // degrees
                break;
                
            case 'quarterwave':
                totalLength = wavelength / 4 * CONSTANTS.ANTENNA.MONOPOLE_FACTOR;
                radiationResistance = MATH.MONOPOLE_RESISTANCE;
                directivity = 1.64; // same as half-wave dipole
                gain = 2.14; // dBi (over ground plane)
                beamwidth = 78; // degrees
                break;
        }
        
        // Calculate element lengths
        const elementLength = dipoleType === 'quarterwave' ? totalLength : totalLength / 2;
        
        // Wire diameter effects (if provided)
        let diameterCorrection = '';
        if (wireDiameter && validateInput(wireDiameter)) {
            const diameterM = convertUnits(wireDiameter, wireUnit, 'm', CONSTANTS.LENGTH_UNITS);
            const lengthToDiameterRatio = totalLength / diameterM;
            
            diameterCorrection = `
                <div class="result-item">
                    <strong>Wire Diameter Effects:</strong>
                    <ul>
                        <li>Wire diameter: ${formatNumber(diameterM * 1000, 2)} mm</li>
                        <li>Length/Diameter ratio: ${formatNumber(lengthToDiameterRatio, 0)}</li>
                        <li>Bandwidth factor: ${lengthToDiameterRatio < 100 ? 'High' : lengthToDiameterRatio < 1000 ? 'Medium' : 'Low'}</li>
                    </ul>
                </div>`;
        }
        
        // Calculate bandwidth (approximate)
        const q = dipoleType === 'quarterwave' ? 25 : 15; // typical Q values
        const bandwidth3db = frequency * CONSTANTS.FREQ_UNITS[freqUnit] / q / 1e6; // MHz
        
        let html = `
            <h4>Dipole Antenna Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>${dipoleType === 'quarterwave' ? 'Monopole' : 'Dipole'} Dimensions:</strong>
                    <ul>
                        <li>Total length: ${formatNumber(totalLength, 3)} m</li>
                        <li>Total length: ${formatNumber(totalLength / CONSTANTS.LENGTH_UNITS.ft, 3)} ft</li>
                        <li>Total length: ${formatNumber(totalLength / CONSTANTS.LENGTH_UNITS.inches, 1)} in</li>`;
        
        if (dipoleType !== 'quarterwave') {
            html += `<li>Each element: ${formatNumber(elementLength, 3)} m</li>`;
        }
        
        html += `
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Electrical Properties:</strong>
                    <ul>
                        <li>Feed impedance: ${formatNumber(radiationResistance, 0)} Ω</li>
                        <li>Directivity: ${formatNumber(directivity, 2)} (${formatNumber(10 * Math.log10(directivity), 2)} dBi)</li>
                        <li>Gain: ${formatNumber(gain, 2)} dBi</li>
                        <li>3dB beamwidth: ${beamwidth}°</li>
                        <li>Bandwidth (VSWR<2): ~${formatNumber(bandwidth3db, 1)} MHz</li>
                    </ul>
                </div>
                
                ${diameterCorrection}
            </div>
            
            <div class="info-section">
                <p><strong>Notes:</strong></p>
                <ul>
                    <li>Values are theoretical for free space operation</li>
                    <li>${dipoleType === 'quarterwave' ? 'Monopole requires ground plane for proper operation' : 'Dipole should be at least λ/4 above ground'}</li>
                    <li>Bandwidth depends on wire thickness and environment</li>
                    <li>SWR bandwidth typically 5-15% for thin wire antennas</li>
                </ul>
            </div>`;
        
        document.getElementById('dipole-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('dipole-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate Yagi-Uda antenna parameters
 */
function calculateYagi() {
    const frequency = parseFloat(document.getElementById('yagi-freq').value);
    const freqUnit = document.getElementById('yagi-freq-unit').value;
    const elements = parseInt(document.getElementById('yagi-elements').value) || 5;
    const boomLength = parseFloat(document.getElementById('yagi-boom-length').value);
    const boomUnit = document.getElementById('yagi-boom-unit').value;
    
    if (!validateInput(frequency)) {
        showError('yagi-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (elements < 3 || elements > 20) {
        showError('yagi-elements', 'Number of elements should be between 3 and 20');
        return;
    }
    
    clearError('yagi-freq');
    clearError('yagi-elements');
    
    try {
        const wavelength = frequencyToWavelength(frequency, freqUnit, CONSTANTS.DEFAULTS.VELOCITY_FACTOR);
        
        // Calculate element lengths
        const drivenElementLength = wavelength / 2 * CONSTANTS.ANTENNA.DIPOLE_FACTOR;
        const reflectorLength = drivenElementLength * CONSTANTS.ANTENNA.YAGI.REFLECTOR_RATIO;
        const directorLength = drivenElementLength * CONSTANTS.ANTENNA.YAGI.DIRECTOR_RATIO;
        
        // Calculate boom length if not provided
        let actualBoomLength;
        if (boomLength && validateInput(boomLength)) {
            actualBoomLength = boomUnit === 'wavelength' ? 
                boomLength * wavelength : 
                convertUnits(boomLength, boomUnit, 'm', CONSTANTS.LENGTH_UNITS);
        } else {
            // Default boom length based on number of elements
            actualBoomLength = (elements - 1) * CONSTANTS.ANTENNA.YAGI.TYPICAL_SPACING * wavelength;
        }
        
        // Calculate approximate gain
        const directorsCount = elements - 2; // excluding driven element and reflector
        const approximateGain = CONSTANTS.ANTENNA.YAGI.BASE_GAIN + 
                              directorsCount * CONSTANTS.ANTENNA.YAGI.GAIN_PER_DIRECTOR;
        
        // Calculate spacing
        const elementSpacing = actualBoomLength / (elements - 1);
        
        // Estimate bandwidth and impedance
        const estimatedImpedance = 28; // typical for Yagi with reflector
        const estimatedBandwidth = 15 - (elements * 0.5); // rough estimate
        
        // Calculate front-to-back ratio (rough estimate)
        const frontToBack = 15 + directorsCount * 2; // dB
        
        // Calculate beamwidth (rough estimate)
        const beamwidthE = 60 / Math.sqrt(approximateGain / 2.14); // degrees
        const beamwidthH = beamwidthE * 1.2; // typically wider in H-plane
        
        let html = `
            <h4>Yagi-Uda Antenna Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Element Lengths:</strong>
                    <ul>
                        <li>Reflector: ${formatNumber(reflectorLength, 3)} m (${formatNumber(reflectorLength / CONSTANTS.LENGTH_UNITS.inches, 1)} in)</li>
                        <li>Driven element: ${formatNumber(drivenElementLength, 3)} m (${formatNumber(drivenElementLength / CONSTANTS.LENGTH_UNITS.inches, 1)} in)</li>
                        <li>Directors: ${formatNumber(directorLength, 3)} m (${formatNumber(directorLength / CONSTANTS.LENGTH_UNITS.inches, 1)} in)</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Boom & Spacing:</strong>
                    <ul>
                        <li>Boom length: ${formatNumber(actualBoomLength, 3)} m (${formatNumber(actualBoomLength / CONSTANTS.LENGTH_UNITS.ft, 2)} ft)</li>
                        <li>Element spacing: ${formatNumber(elementSpacing, 3)} m (${formatNumber(elementSpacing / CONSTANTS.LENGTH_UNITS.inches, 1)} in)</li>
                        <li>Spacing in λ: ${formatNumber(elementSpacing / wavelength, 3)}λ</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Performance (Estimated):</strong>
                    <ul>
                        <li>Gain: ~${formatNumber(approximateGain, 1)} dBi</li>
                        <li>Front-to-back: ~${formatNumber(frontToBack, 0)} dB</li>
                        <li>Feed impedance: ~${estimatedImpedance} Ω</li>
                        <li>3dB beamwidth: ${formatNumber(beamwidthE, 0)}° × ${formatNumber(beamwidthH, 0)}°</li>
                        <li>Bandwidth: ~${formatNumber(estimatedBandwidth, 1)}%</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Element Layout:</strong>
                    <ul>
                        <li>Reflector at 0 m</li>
                        <li>Driven element at ${formatNumber(elementSpacing, 3)} m</li>`;
        
        for (let i = 1; i <= directorsCount; i++) {
            html += `<li>Director ${i} at ${formatNumber(elementSpacing * (i + 1), 3)} m</li>`;
        }
        
        html += `
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Design Notes:</strong></p>
                <ul>
                    <li>This is a simplified Yagi design using typical ratios</li>
                    <li>Optimal designs require modeling software (NEC, EZNEC, etc.)</li>
                    <li>Element diameters and mounting method affect tuning</li>
                    <li>Gamma match or balun typically needed for 50Ω feed</li>
                    <li>Performance estimates are approximate - actual results vary</li>
                </ul>
            </div>`;
        
        document.getElementById('yagi-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('yagi-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate loop antenna parameters
 */
function calculateLoop() {
    const frequency = parseFloat(document.getElementById('loop-freq').value);
    const freqUnit = document.getElementById('loop-freq-unit').value;
    const loopType = document.getElementById('loop-type').value;
    const shape = document.getElementById('loop-shape').value;
    
    if (!validateInput(frequency)) {
        showError('loop-freq', 'Please enter a valid frequency');
        return;
    }
    
    clearError('loop-freq');
    
    try {
        const wavelength = frequencyToWavelength(frequency, freqUnit, CONSTANTS.DEFAULTS.VELOCITY_FACTOR);
        
        let circumference, radiationResistance, gain, efficiency, bandwidth, directivity;
        let dimensions = {};
        
        switch (loopType) {
            case 'small':
                // Small loop (< λ/10 circumference)
                circumference = wavelength * 0.08; // 0.08λ typical
                radiationResistance = 31171 * Math.pow(circumference / wavelength, 4); // Wheeler's formula
                efficiency = 0.1; // 10% typical for small loops without loading
                gain = -1.76; // dBi (compared to isotropic)
                directivity = 1.5; // figure-8 pattern
                bandwidth = 1; // very narrow
                break;
                
            case 'large':
                // Full-wave loop
                circumference = wavelength * 1.005; // slightly larger than 1λ
                radiationResistance = 115; // approximate
                efficiency = 0.95; // high efficiency
                gain = 2.1; // dBi
                directivity = 1.64; // similar to dipole
                bandwidth = 10; // moderate bandwidth
                break;
                
            case 'quad':
                // Quad loop (2λ circumference)
                circumference = wavelength * 2.0;
                radiationResistance = 50; // approximate
                efficiency = 0.9; // good efficiency
                gain = 3.1; // dBi
                directivity = 2.0;
                bandwidth = 8; // moderate bandwidth
                break;
        }
        
        // Calculate dimensions based on shape
        switch (shape) {
            case 'circular':
                dimensions.diameter = circumference / Math.PI;
                dimensions.radius = dimensions.diameter / 2;
                dimensions.area = Math.PI * dimensions.radius * dimensions.radius;
                break;
                
            case 'square':
                dimensions.sideLength = circumference / 4;
                dimensions.area = dimensions.sideLength * dimensions.sideLength;
                dimensions.diagonal = dimensions.sideLength * Math.sqrt(2);
                break;
                
            case 'rectangular':
                // Assume 2:1 aspect ratio
                dimensions.longSide = circumference / 6;
                dimensions.shortSide = circumference / 12;
                dimensions.area = dimensions.longSide * dimensions.shortSide;
                break;
        }
        
        // Calculate magnetic field parameters for small loops
        let magneticMoment = '';
        if (loopType === 'small') {
            const area = dimensions.area;
            const inductance = area * 4e-7 * Math.PI / circumference; // approximate
            magneticMoment = `
                <div class="result-item">
                    <strong>Magnetic Properties:</strong>
                    <ul>
                        <li>Loop area: ${formatNumber(area, 6)} m²</li>
                        <li>Inductance: ~${formatNumber(inductance * 1e6, 2)} µH</li>
                        <li>Required Q: ${formatNumber(50 / radiationResistance, 0)} (for 50Ω match)</li>
                    </ul>
                </div>`;
        }
        
        let html = `
            <h4>Loop Antenna Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Loop Dimensions:</strong>
                    <ul>
                        <li>Circumference: ${formatNumber(circumference, 3)} m</li>
                        <li>Circumference: ${formatNumber(circumference / CONSTANTS.LENGTH_UNITS.ft, 2)} ft</li>`;
        
        switch (shape) {
            case 'circular':
                html += `
                        <li>Diameter: ${formatNumber(dimensions.diameter, 3)} m</li>
                        <li>Radius: ${formatNumber(dimensions.radius, 3)} m</li>`;
                break;
            case 'square':
                html += `
                        <li>Side length: ${formatNumber(dimensions.sideLength, 3)} m</li>
                        <li>Diagonal: ${formatNumber(dimensions.diagonal, 3)} m</li>`;
                break;
            case 'rectangular':
                html += `
                        <li>Long side: ${formatNumber(dimensions.longSide, 3)} m</li>
                        <li>Short side: ${formatNumber(dimensions.shortSide, 3)} m</li>`;
                break;
        }
        
        html += `
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Electrical Properties:</strong>
                    <ul>
                        <li>Radiation resistance: ${formatNumber(radiationResistance, 2)} Ω</li>
                        <li>Efficiency: ${formatNumber(efficiency * 100, 1)}%</li>
                        <li>Gain: ${formatNumber(gain, 1)} dBi</li>
                        <li>Directivity: ${formatNumber(directivity, 2)}</li>
                        <li>Bandwidth: ~${formatNumber(bandwidth, 1)}%</li>
                    </ul>
                </div>
                
                ${magneticMoment}
            </div>
            
            <div class="info-section">
                <p><strong>Loop Type:</strong> ${loopType === 'small' ? 'Magnetic Loop' : loopType === 'large' ? 'Full-Wave Loop' : 'Quad Loop'}</p>
                <p><strong>Notes:</strong></p>
                <ul>`;
        
        if (loopType === 'small') {
            html += `
                    <li>Small loops are magnetic antennas with very narrow bandwidth</li>
                    <li>Requires high-Q tuning capacitor (vacuum variable recommended)</li>
                    <li>Feed coupling is critical - use small coupling loop</li>
                    <li>Efficiency can be improved with larger conductor diameter</li>`;
        } else {
            html += `
                    <li>Large loops are current antennas with broader bandwidth</li>
                    <li>Can be fed directly or with matching network</li>
                    <li>Circular polarization possible with proper phasing</li>
                    <li>Height above ground affects radiation pattern</li>`;
        }
        
        html += `
                </ul>
            </div>`;
        
        document.getElementById('loop-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('loop-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate patch antenna parameters
 */
function calculatePatch() {
    const frequency = parseFloat(document.getElementById('patch-freq').value);
    const freqUnit = document.getElementById('patch-freq-unit').value;
    const substrateEr = parseFloat(document.getElementById('patch-substrate-er').value) || CONSTANTS.DEFAULTS.SUBSTRATE_ER;
    const thickness = parseFloat(document.getElementById('patch-thickness').value) || CONSTANTS.DEFAULTS.SUBSTRATE_THICKNESS;
    const thicknessUnit = document.getElementById('patch-thickness-unit').value;
    
    if (!validateInput(frequency)) {
        showError('patch-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (!validateInput(substrateEr, 1, 15)) {
        showError('patch-substrate-er', 'Please enter a valid dielectric constant (1-15)');
        return;
    }
    
    clearError('patch-freq');
    clearError('patch-substrate-er');
    
    try {
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const thicknessM = convertUnits(thickness, thicknessUnit, 'm', CONSTANTS.LENGTH_UNITS);
        
        // Calculate effective dielectric constant
        const effectiveEr = (substrateEr + 1) / 2 + 
                          ((substrateEr - 1) / 2) * (1 / Math.sqrt(1 + 12 * thicknessM / 0.001)); // rough approximation
        
        // Calculate patch dimensions (rectangular patch)
        const c = CONSTANTS.SPEED_OF_LIGHT;
        const width = c / (2 * freqHz * Math.sqrt(effectiveEr)); // Width for efficient radiation
        
        // Calculate effective length considering fringing fields
        const deltaL = 0.412 * thicknessM * 
                       ((effectiveEr + 0.3) * (width / thicknessM + 0.264)) /
                       ((effectiveEr - 0.258) * (width / thicknessM + 0.8));
        
        const effectiveLength = c / (2 * freqHz * Math.sqrt(effectiveEr));
        const physicalLength = effectiveLength - 2 * deltaL;
        
        // Calculate input impedance (rough approximation)
        const impedance = 90 * (substrateEr * substrateEr) / (substrateEr - 1) * 
                         Math.pow(physicalLength / width, 2);
        
        // Calculate bandwidth (rough estimate)
        const bandwidth = 3.77 * (substrateEr - 1) / (substrateEr * substrateEr) * 
                         (thicknessM * 1000) * (width / physicalLength);
        
        // Calculate directivity and gain
        const directivity = 32400 / (78 * 78); // rough approximation for rectangular patch
        const efficiency = 0.85; // typical efficiency
        const gain = 10 * Math.log10(directivity * efficiency);
        
        // Calculate ground plane size (recommended)
        const groundPlaneSize = Math.max(width, physicalLength) + 6 * thicknessM;
        
        let html = `
            <h4>Patch Antenna Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Patch Dimensions:</strong>
                    <ul>
                        <li>Width (W): ${formatNumber(width * 1000, 2)} mm</li>
                        <li>Length (L): ${formatNumber(physicalLength * 1000, 2)} mm</li>
                        <li>Area: ${formatNumber(width * physicalLength * 1000000, 1)} mm²</li>
                        <li>Aspect ratio: ${formatNumber(physicalLength / width, 2)}</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Substrate Properties:</strong>
                    <ul>
                        <li>Dielectric constant: ${substrateEr}</li>
                        <li>Effective εᵣ: ${formatNumber(effectiveEr, 2)}</li>
                        <li>Thickness: ${formatNumber(thickness, 2)} ${thicknessUnit}</li>
                        <li>ΔL correction: ${formatNumber(deltaL * 1000, 3)} mm</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Electrical Properties:</strong>
                    <ul>
                        <li>Input impedance: ~${formatNumber(impedance, 0)} Ω</li>
                        <li>Bandwidth: ~${formatNumber(bandwidth, 1)}%</li>
                        <li>Directivity: ${formatNumber(10 * Math.log10(directivity), 1)} dBi</li>
                        <li>Gain: ~${formatNumber(gain, 1)} dBi</li>
                        <li>Beamwidth: ~78° × 78°</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Construction:</strong>
                    <ul>
                        <li>Ground plane size: ${formatNumber(groundPlaneSize * 1000, 1)} mm</li>
                        <li>Feed point: ${formatNumber(physicalLength * 1000 / 3, 1)} mm from edge</li>
                        <li>Polarization: Linear (along length)</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Design Notes:</strong></p>
                <ul>
                    <li>This is a first-order rectangular patch design</li>
                    <li>Inset feed or probe feed can be used for impedance matching</li>
                    <li>Circular patches provide circular polarization capability</li>
                    <li>Larger ground plane improves front-to-back ratio</li>
                    <li>Use EM simulation for accurate results</li>
                    <li>Typical materials: FR4 (εᵣ=4.4), Rogers substrates</li>
                </ul>
                
                <p><strong>Substrate:</strong> εᵣ=${substrateEr}, h=${formatNumber(thickness, 2)}${thicknessUnit}</p>
            </div>`;
        
        document.getElementById('patch-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('patch-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}