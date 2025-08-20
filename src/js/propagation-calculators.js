// Propagation and link budget calculator functions

/**
 * Calculate Free Space Path Loss (FSPL)
 */
function calculateFSPL() {
    const frequency = parseFloat(document.getElementById('fspl-freq').value);
    const freqUnit = document.getElementById('fspl-freq-unit').value;
    const distance = parseFloat(document.getElementById('fspl-distance').value);
    const distanceUnit = document.getElementById('fspl-distance-unit').value;
    
    if (!validateInput(frequency)) {
        showError('fspl-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (!validateInput(distance)) {
        showError('fspl-distance', 'Please enter a valid distance');
        return;
    }
    
    clearError('fspl-freq');
    clearError('fspl-distance');
    
    try {
        // Convert to standard units
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const distanceM = convertUnits(distance, distanceUnit, 'm', CONSTANTS.LENGTH_UNITS);
        
        // Calculate FSPL
        const fsplDb = freeSpacePathLoss(freqHz, distanceM);
        
        // Calculate wavelength and related parameters
        const wavelength = frequencyToWavelength(freqHz, 'Hz');
        const farFieldDistance = 2 * wavelength; // Rough approximation
        const fresnelRadius = fresnelZoneRadius(freqHz, distanceM / 2, distanceM / 2, 1);
        
        // Calculate received power for various transmit powers
        const txPowers = [1, 10, 100, 1000]; // Watts
        const rxPowers = txPowers.map(p => MATH.WATTS_TO_DBM(p) - fsplDb);
        
        // Calculate isotropic field strength
        const eirp1W = 1; // 1 Watt isotropic
        const fieldStrength = Math.sqrt(30 * eirp1W) / distanceM; // V/m
        
        // Get frequency band
        const band = getFrequencyBand(freqHz);
        
        let html = `
            <h4>Free Space Path Loss Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Path Loss:</strong>
                    <ul>
                        <li>FSPL = ${formatNumber(fsplDb, 2)} dB</li>
                        <li>Linear loss = ${formatNumber(MATH.DB_TO_RATIO(fsplDb), 0, true)}</li>
                        <li>Distance: ${formatNumber(distance, 3)} ${distanceUnit}</li>
                        <li>Frequency: ${formatNumber(frequency, 3)} ${freqUnit}</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Received Power (isotropic):</strong>
                    <ul>
                        <li>1W TX: ${formatNumber(rxPowers[0], 1)} dBm</li>
                        <li>10W TX: ${formatNumber(rxPowers[1], 1)} dBm</li>
                        <li>100W TX: ${formatNumber(rxPowers[2], 1)} dBm</li>
                        <li>1kW TX: ${formatNumber(rxPowers[3], 1)} dBm</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Wave Properties:</strong>
                    <ul>
                        <li>Wavelength: ${formatNumber(wavelength, 3)} m</li>
                        <li>Far field distance: ${formatNumber(farFieldDistance, 3)} m</li>
                        <li>First Fresnel radius: ${formatNumber(fresnelRadius, 3)} m</li>
                        <li>Frequency band: ${band}</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Field Strength (1W EIRP):</strong>
                    <ul>
                        <li>E-field: ${formatNumber(fieldStrength * 1000, 3)} mV/m</li>
                        <li>E-field: ${formatNumber(20 * Math.log10(fieldStrength * 1e6), 1)} dBμV/m</li>
                        <li>Power density: ${formatNumber(fieldStrength * fieldStrength / 377 * 1000, 6)} mW/m²</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>FSPL Formula:</strong> FSPL(dB) = 32.44 + 20log₁₀(f_MHz) + 20log₁₀(d_km)</p>
                <p><strong>Assumptions:</strong></p>
                <ul>
                    <li>Free space propagation (no obstacles, ground reflections)</li>
                    <li>Isotropic antennas (0 dBi gain)</li>
                    <li>Perfect polarization match</li>
                    <li>No atmospheric absorption</li>
                </ul>
                
                <p><strong>Note:</strong> Real-world path loss includes additional factors like 
                ground reflection, atmospheric absorption, and obstacles.</p>
            </div>`;
        
        document.getElementById('fspl-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('fspl-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate complete link budget
 */
function calculateLinkBudget() {
    const frequency = parseFloat(document.getElementById('lb-freq').value);
    const freqUnit = document.getElementById('lb-freq-unit').value;
    const distance = parseFloat(document.getElementById('lb-distance').value);
    const distanceUnit = document.getElementById('lb-distance-unit').value;
    const txPower = parseFloat(document.getElementById('lb-tx-power').value);
    const txPowerUnit = document.getElementById('lb-tx-power-unit').value;
    const txGain = parseFloat(document.getElementById('lb-tx-gain').value) || 0;
    const rxGain = parseFloat(document.getElementById('lb-rx-gain').value) || 0;
    const txLoss = parseFloat(document.getElementById('lb-tx-loss').value) || 0;
    const rxLoss = parseFloat(document.getElementById('lb-rx-loss').value) || 0;
    const otherLoss = parseFloat(document.getElementById('lb-other-loss').value) || 0;
    
    if (!validateInput(frequency)) {
        showError('lb-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (!validateInput(distance)) {
        showError('lb-distance', 'Please enter a valid distance');
        return;
    }
    
    if (!validateInput(txPower)) {
        showError('lb-tx-power', 'Please enter a valid transmit power');
        return;
    }
    
    clearError('lb-freq');
    clearError('lb-distance');
    clearError('lb-tx-power');
    
    try {
        // Convert to standard units
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const distanceM = convertUnits(distance, distanceUnit, 'm', CONSTANTS.LENGTH_UNITS);
        
        // Convert TX power to dBm
        const txPowerDbm = convertPower(txPower, txPowerUnit, 'dBm');
        const txPowerWatts = convertPower(txPower, txPowerUnit, 'W');
        
        // Calculate FSPL
        const fsplDb = freeSpacePathLoss(freqHz, distanceM);
        
        // Calculate EIRP
        const eirpDbm = txPowerDbm + txGain - txLoss;
        const eirpWatts = convertPower(eirpDbm, 'dBm', 'W');
        
        // Calculate total losses
        const totalLoss = fsplDb + txLoss + rxLoss + otherLoss;
        
        // Calculate received power
        const rxPowerDbm = eirpDbm - fsplDb - rxLoss - otherLoss;
        const rxPowerWatts = convertPower(rxPowerDbm, 'dBm', 'W');
        
        // Calculate received signal with RX antenna gain
        const signalDbm = rxPowerDbm + rxGain;
        const signalWatts = convertPower(signalDbm, 'dBm', 'W');
        
        // Calculate link margin for typical receiver sensitivities
        const sensitivities = {
            'SSB/CW': -120,
            'FM Narrow': -110,
            'FM Wide': -105,
            'Digital (1200 bps)': -115,
            'Digital (9600 bps)': -105,
            'WiFi 802.11g': -85
        };
        
        const margins = Object.entries(sensitivities).map(([mode, sens]) => ({
            mode,
            sensitivity: sens,
            margin: signalDbm - sens
        }));
        
        // Calculate path efficiency
        const pathEfficiency = (rxPowerWatts / txPowerWatts) * 100;
        
        // Get frequency band
        const band = getFrequencyBand(freqHz);
        
        let html = `
            <h4>Link Budget Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Transmitter:</strong>
                    <ul>
                        <li>TX Power: ${formatNumber(txPower, 3)} ${txPowerUnit} (${formatNumber(txPowerDbm, 1)} dBm)</li>
                        <li>TX Antenna Gain: ${formatNumber(txGain, 1)} dBi</li>
                        <li>TX Line Loss: ${formatNumber(txLoss, 1)} dB</li>
                        <li>EIRP: ${formatNumber(eirpDbm, 1)} dBm (${formatNumber(eirpWatts, 6)} W)</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Path & Receiver:</strong>
                    <ul>
                        <li>Distance: ${formatNumber(distance, 3)} ${distanceUnit}</li>
                        <li>Free Space Loss: ${formatNumber(fsplDb, 1)} dB</li>
                        <li>RX Line Loss: ${formatNumber(rxLoss, 1)} dB</li>
                        <li>Other Losses: ${formatNumber(otherLoss, 1)} dB</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Received Signal:</strong>
                    <ul>
                        <li>RX Power (isotropic): ${formatNumber(rxPowerDbm, 1)} dBm</li>
                        <li>RX Antenna Gain: ${formatNumber(rxGain, 1)} dBi</li>
                        <li>Signal Level: ${formatNumber(signalDbm, 1)} dBm</li>
                        <li>Signal Power: ${formatNumber(signalWatts, 6, true)} W</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Link Summary:</strong>
                    <ul>
                        <li>Total Path Loss: ${formatNumber(totalLoss, 1)} dB</li>
                        <li>Path Efficiency: ${formatNumber(pathEfficiency, 6, true)}%</li>
                        <li>Frequency: ${formatNumber(frequency, 3)} ${freqUnit} (${band})</li>
                    </ul>
                </div>
            </div>
            
            <h5>Link Margins by Mode</h5>
            <div class="result-table">
                <table>
                    <thead>
                        <tr>
                            <th>Mode</th>
                            <th>Sensitivity</th>
                            <th>Margin</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        margins.forEach(margin => {
            const status = margin.margin > 10 ? 'Excellent' : 
                          margin.margin > 6 ? 'Good' : 
                          margin.margin > 3 ? 'Fair' : 
                          margin.margin > 0 ? 'Marginal' : 'Insufficient';
            
            const color = margin.margin > 6 ? 'green' : 
                         margin.margin > 3 ? 'orange' : 
                         margin.margin > 0 ? 'orange' : 'red';
            
            html += `
                        <tr>
                            <td>${margin.mode}</td>
                            <td>${margin.sensitivity} dBm</td>
                            <td>${formatNumber(margin.margin, 1)} dB</td>
                            <td style="color: ${color}">${status}</td>
                        </tr>`;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="info-section">
                <p><strong>Link Budget Equation:</strong></p>
                <p>P_rx = EIRP - FSPL - Line_Losses + G_rx</p>
                <p><strong>Recommended Margins:</strong> 10+ dB (excellent), 6+ dB (good), 3+ dB (minimum)</p>
                
                <p><strong>Notes:</strong></p>
                <ul>
                    <li>Calculations assume free space propagation</li>
                    <li>Real links may have fading, interference, and other impairments</li>
                    <li>Consider seasonal variations and antenna patterns</li>
                    <li>Add margin for rain fade at microwave frequencies</li>
                </ul>
            </div>`;
        
        document.getElementById('lb-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('lb-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Calculate Fresnel zone parameters
 */
function calculateFresnel() {
    const frequency = parseFloat(document.getElementById('fresnel-freq').value);
    const freqUnit = document.getElementById('fresnel-freq-unit').value;
    const distance = parseFloat(document.getElementById('fresnel-distance').value);
    const distanceUnit = document.getElementById('fresnel-distance-unit').value;
    const position = parseFloat(document.getElementById('fresnel-position').value);
    const positionUnit = document.getElementById('fresnel-position-unit').value;
    
    if (!validateInput(frequency)) {
        showError('fresnel-freq', 'Please enter a valid frequency');
        return;
    }
    
    if (!validateInput(distance)) {
        showError('fresnel-distance', 'Please enter a valid distance');
        return;
    }
    
    clearError('fresnel-freq');
    clearError('fresnel-distance');
    
    try {
        // Convert to standard units
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const totalDistanceM = convertUnits(distance, distanceUnit, 'm', CONSTANTS.LENGTH_UNITS);
        
        // Determine position from transmitter
        let d1; // Distance from transmitter to point
        
        if (!position || !validateInput(position)) {
            // Default to midpoint
            d1 = totalDistanceM / 2;
        } else {
            if (positionUnit === 'percent') {
                d1 = totalDistanceM * position / 100;
            } else {
                d1 = convertUnits(position, positionUnit, 'm', CONSTANTS.LENGTH_UNITS);
            }
        }
        
        const d2 = totalDistanceM - d1; // Distance from point to receiver
        
        if (d1 <= 0 || d2 <= 0 || d1 >= totalDistanceM) {
            throw new Error('Position must be between transmitter and receiver');
        }
        
        // Calculate Fresnel zone radii
        const zones = [1, 2, 3, 4, 5].map(n => ({
            zone: n,
            radius: fresnelZoneRadius(freqHz, d1, d2, n)
        }));
        
        // Calculate wavelength
        const wavelength = frequencyToWavelength(freqHz, 'Hz');
        
        // Calculate clearance recommendations
        const firstFresnelRadius = zones[0].radius;
        const recommendedClearance60 = firstFresnelRadius * 0.6; // 60% clearance
        const recommendedClearance100 = firstFresnelRadius; // 100% clearance
        
        // Calculate Earth bulge (for long distances)
        const earthRadius = 6371000; // meters
        const earthBulge = (d1 * d2) / (2 * earthRadius);
        
        // Calculate antenna height requirements
        const antennaHeightRecommended = recommendedClearance60 + earthBulge;
        
        // Calculate path loss impact
        const clearanceImpact = [
            { clearance: 0, loss: 6 },      // Complete obstruction
            { clearance: 0.2, loss: 3 },   // 20% clearance
            { clearance: 0.4, loss: 1 },   // 40% clearance
            { clearance: 0.6, loss: 0 },   // 60% clearance (recommended)
            { clearance: 1.0, loss: 0 }    // 100% clearance
        ];
        
        let html = `
            <h4>Fresnel Zone Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Path Geometry:</strong>
                    <ul>
                        <li>Total distance: ${formatNumber(totalDistanceM / 1000, 3)} km</li>
                        <li>Position from TX: ${formatNumber(d1 / 1000, 3)} km (${formatNumber(d1 / totalDistanceM * 100, 1)}%)</li>
                        <li>Position to RX: ${formatNumber(d2 / 1000, 3)} km (${formatNumber(d2 / totalDistanceM * 100, 1)}%)</li>
                        <li>Wavelength: ${formatNumber(wavelength, 3)} m</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Fresnel Zone Radii:</strong>
                    <ul>`;
        
        zones.forEach(zone => {
            html += `<li>Zone ${zone.zone}: ${formatNumber(zone.radius, 2)} m</li>`;
        });
        
        html += `
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Clearance Requirements:</strong>
                    <ul>
                        <li>60% clearance: ${formatNumber(recommendedClearance60, 2)} m</li>
                        <li>100% clearance: ${formatNumber(recommendedClearance100, 2)} m</li>
                        <li>Earth bulge: ${formatNumber(earthBulge, 3)} m</li>
                        <li>Min antenna height: ${formatNumber(antennaHeightRecommended, 1)} m</li>
                    </ul>
                </div>
                
                <div class="result-item">
                    <strong>Obstruction Impact:</strong>
                    <ul>`;
        
        clearanceImpact.forEach(impact => {
            html += `<li>${formatNumber(impact.clearance * 100, 0)}% clearance: ${impact.loss} dB loss</li>`;
        });
        
        html += `
                    </ul>
                </div>
            </div>
            
            <div class="info-section">
                <p><strong>Fresnel Zone Formula:</strong></p>
                <p>r_n = √(n × λ × d₁ × d₂ / (d₁ + d₂))</p>
                
                <p><strong>Clearance Guidelines:</strong></p>
                <ul>
                    <li>60% of first Fresnel zone clearance is typically sufficient</li>
                    <li>Obstacles in odd zones (1st, 3rd, 5th) cause destructive interference</li>
                    <li>Obstacles in even zones (2nd, 4th, 6th) cause less impact</li>
                    <li>Complete first zone obstruction causes ~6 dB additional loss</li>
                </ul>
                
                <p><strong>Applications:</strong></p>
                <ul>
                    <li>Microwave link planning</li>
                    <li>Line-of-sight path clearance verification</li>
                    <li>Antenna height determination</li>
                    <li>Obstacle impact assessment</li>
                </ul>
            </div>`;
        
        document.getElementById('fresnel-results').innerHTML = html;
        
    } catch (error) {
        document.getElementById('fresnel-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}