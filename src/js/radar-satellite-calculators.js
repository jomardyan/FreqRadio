// Radar and Satellite Communications Calculator Functions

// Physical constants (not in the shared constants.js)
const BOLTZMANN_K     = 1.380649e-23;   // J/K  (Boltzmann constant)
const EARTH_RADIUS_KM = 6371;           // km   (mean Earth radius)
const EARTH_GM        = 3.986004418e14; // m³/s² (Earth gravitational parameter)
const T_STANDARD_K    = 290;            // K    (standard reference temperature, ITU-R)

// Radar frequency band definitions
const RADAR_BANDS = [
    { name: 'HF',      minGHz: 0.003, maxGHz: 0.03  },
    { name: 'VHF',     minGHz: 0.03,  maxGHz: 0.3   },
    { name: 'UHF',     minGHz: 0.3,   maxGHz: 1.0   },
    { name: 'L-band',  minGHz: 1.0,   maxGHz: 2.0   },
    { name: 'S-band',  minGHz: 2.0,   maxGHz: 4.0   },
    { name: 'C-band',  minGHz: 4.0,   maxGHz: 8.0   },
    { name: 'X-band',  minGHz: 8.0,   maxGHz: 12.0  },
    { name: 'Ku-band', minGHz: 12.0,  maxGHz: 18.0  },
    { name: 'K-band',  minGHz: 18.0,  maxGHz: 27.0  },
    { name: 'Ka-band', minGHz: 27.0,  maxGHz: 40.0  },
    { name: 'V-band',  minGHz: 40.0,  maxGHz: 75.0  },
    { name: 'W-band',  minGHz: 75.0,  maxGHz: 110.0 }
];

/**
 * Return the radar/satellite band name for a frequency in Hz
 */
function getRadarBandName(freqHz) {
    const freqGHz = freqHz / 1e9;
    for (const band of RADAR_BANDS) {
        if (freqGHz >= band.minGHz && freqGHz < band.maxGHz) {
            return band.name;
        }
    }
    return freqGHz >= 110 ? 'mmWave (>110 GHz)' : 'Sub-HF (<3 MHz)';
}

/**
 * Convert an RCS value to square metres
 * @param {number} raw   - Input value
 * @param {string} unit  - 'm2' or 'dBsm'
 * @returns {number} RCS in m²
 */
function rcsToM2(raw, unit) {
    return unit === 'dBsm' ? Math.pow(10, raw / 10) : raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RADAR RANGE EQUATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Monostatic Radar Range Equation
 * R = [ P_t · G² · σ · λ² / ((4π)³ · S_min) ]^(1/4)
 */
function calculateRadarRange() {
    const frequency   = parseFloat(document.getElementById('radar-freq').value);
    const freqUnit    = document.getElementById('radar-freq-unit').value;
    const txPowerRaw  = parseFloat(document.getElementById('radar-tx-power').value);
    const txPowerUnit = document.getElementById('radar-tx-power-unit').value;
    const antGainDb   = parseFloat(document.getElementById('radar-ant-gain').value);
    const rcsRaw      = parseFloat(document.getElementById('radar-rcs').value);
    const rcsUnit     = document.getElementById('radar-rcs-unit').value;
    const noiseFigDb  = parseFloat(document.getElementById('radar-nf').value)   || 5;
    const bwMHz       = parseFloat(document.getElementById('radar-bw').value)   || 1;
    const snrMinDb    = parseFloat(document.getElementById('radar-snr').value)  || 13;
    const sysLossDb   = parseFloat(document.getElementById('radar-loss').value) || 3;

    if (!validateInput(frequency)) {
        showError('radar-freq', 'Please enter a valid frequency');
        return;
    }
    if (isNaN(txPowerRaw)) {
        showError('radar-tx-power', 'Please enter a valid transmit power');
        return;
    }
    if (isNaN(antGainDb)) {
        showError('radar-ant-gain', 'Please enter a valid antenna gain');
        return;
    }
    if (isNaN(rcsRaw)) {
        showError('radar-rcs', 'Please enter a valid RCS value');
        return;
    }

    clearError('radar-freq');
    clearError('radar-tx-power');
    clearError('radar-ant-gain');
    clearError('radar-rcs');

    try {
        const freqHz  = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const lambdaM = CONSTANTS.SPEED_OF_LIGHT / freqHz;

        // Convert TX power to watts
        let txPowerW;
        switch (txPowerUnit) {
            case 'W':   txPowerW = txPowerRaw; break;
            case 'kW':  txPowerW = txPowerRaw * 1e3; break;
            case 'MW':  txPowerW = txPowerRaw * 1e6; break;
            case 'dBW': txPowerW = Math.pow(10, txPowerRaw / 10); break;
            default:    txPowerW = txPowerRaw;
        }

        const rcsM2          = rcsToM2(rcsRaw, rcsUnit);
        const gainLin        = Math.pow(10, antGainDb  / 10);
        const noiseFigLin    = Math.pow(10, noiseFigDb / 10);
        const sysLossLin     = Math.pow(10, sysLossDb  / 10);
        const snrMinLin      = Math.pow(10, snrMinDb   / 10);
        const bwHz           = bwMHz * 1e6;

        // Receiver noise power (kTBF)
        const noisePowerW    = BOLTZMANN_K * T_STANDARD_K * bwHz * noiseFigLin;
        const noisePowerDbm  = 10 * Math.log10(noisePowerW) + 30;

        // Minimum detectable signal (S_min = noise × SNR_min × system_loss)
        const sMinW          = noisePowerW * snrMinLin * sysLossLin;
        const sMinDbm        = 10 * Math.log10(sMinW) + 30;

        // Radar Range Equation (monostatic, same antenna Tx/Rx)
        const rangeM = Math.pow(
            (txPowerW * gainLin * gainLin * rcsM2 * lambdaM * lambdaM) /
            (Math.pow(4 * Math.PI, 3) * sMinW),
            0.25
        );
        const rangeKm = rangeM / 1000;
        const rangeNm = rangeKm / 1.852;

        const erpDbw     = 10 * Math.log10(txPowerW * gainLin);
        const txPowerDbw = 10 * Math.log10(txPowerW);
        const rcsDbsm    = 10 * Math.log10(rcsM2);

        const html = `
            <h4>Radar Range Equation Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Detection Range:</strong>
                    <ul>
                        <li>R_max = ${formatNumber(rangeKm, 2)} km</li>
                        <li>R_max = ${formatNumber(rangeNm, 2)} nm</li>
                        <li>R_max = ${formatNumber(rangeKm * 0.621371, 2)} miles</li>
                        <li>R_max = ${formatNumber(rangeM, 0)} m</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Transmitter:</strong>
                    <ul>
                        <li>P_t = ${formatNumber(txPowerDbw, 2)} dBW (${formatNumber(txPowerW, 2)} W)</li>
                        <li>Antenna gain = ${formatNumber(antGainDb, 1)} dBi</li>
                        <li>ERP = ${formatNumber(erpDbw, 2)} dBW</li>
                        <li>Band: ${getRadarBandName(freqHz)}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Target &amp; Wavelength:</strong>
                    <ul>
                        <li>RCS = ${formatNumber(rcsM2, 4)} m²</li>
                        <li>RCS = ${formatNumber(rcsDbsm, 2)} dBsm</li>
                        <li>λ = ${formatNumber(lambdaM * 100, 3)} cm</li>
                        <li>Frequency = ${formatNumber(frequency, 3)} ${freqUnit}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Receiver Sensitivity:</strong>
                    <ul>
                        <li>Noise figure = ${formatNumber(noiseFigDb, 1)} dB</li>
                        <li>Noise floor = ${formatNumber(noisePowerDbm, 1)} dBm</li>
                        <li>S_min = ${formatNumber(sMinDbm, 1)} dBm</li>
                        <li>Required S/N = ${formatNumber(snrMinDb, 1)} dB</li>
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>R = [ P_t · G² · σ · λ² / ((4π)³ · S_min) ]^(1/4)</strong></p>
                <ul>
                    <li>Range scales as the 4th root — doubling P_t only increases range ≈ 19%</li>
                    <li>Doubling antenna gain increases range ≈ 41%</li>
                    <li>Assumes monostatic radar (same aperture for Tx and Rx)</li>
                    <li>System losses include feed, atmosphere, processing, and straddling losses</li>
                </ul>
            </div>`;

        document.getElementById('radar-range-results').innerHTML = html;

    } catch (error) {
        document.getElementById('radar-range-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RADAR PULSE PARAMETERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Radar pulse timing: PRF, duty cycle, range resolution, unambiguous range/velocity
 */
function calculateRadarPulse() {
    const prf        = parseFloat(document.getElementById('radar-prf').value);
    const pwRaw      = parseFloat(document.getElementById('radar-pw').value);
    const pwUnit     = document.getElementById('radar-pw-unit').value;
    const peakPower  = parseFloat(document.getElementById('radar-peak-power').value);
    const frequency  = parseFloat(document.getElementById('radar-pulse-freq').value);
    const freqUnit   = document.getElementById('radar-pulse-freq-unit').value;

    if (!validateInput(prf)) {
        showError('radar-prf', 'Please enter a valid PRF');
        return;
    }
    if (!validateInput(pwRaw)) {
        showError('radar-pw', 'Please enter a valid pulse width');
        return;
    }
    clearError('radar-prf');
    clearError('radar-pw');

    try {
        const pwFactors = { us: 1e-6, ns: 1e-9, ms: 1e-3 };
        const pwSec     = pwRaw * (pwFactors[pwUnit] || 1e-6);
        const priSec    = 1 / prf;
        const dutyCycle = pwSec / priSec;

        const maxRangeM  = CONSTANTS.SPEED_OF_LIGHT / (2 * prf);
        const rangeResM  = CONSTANTS.SPEED_OF_LIGHT * pwSec / 2;
        const minRangeM  = rangeResM; // blind range ≈ pulse-width range

        let html = `
            <h4>Radar Pulse Parameter Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Timing:</strong>
                    <ul>
                        <li>PRF = ${formatNumber(prf, 0)} Hz</li>
                        <li>PRI = ${formatNumber(priSec * 1e6, 2)} µs</li>
                        <li>Pulse width τ = ${formatNumber(pwSec * 1e6, 3)} µs</li>
                        <li>Duty cycle = ${formatNumber(dutyCycle * 100, 3)}%</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Range Performance:</strong>
                    <ul>
                        <li>Max unambig. range = ${formatNumber(maxRangeM / 1000, 2)} km</li>
                        <li>Range resolution = ${formatNumber(rangeResM, 2)} m</li>
                        <li>Minimum range (blind) = ${formatNumber(minRangeM, 2)} m</li>
                    </ul>
                </div>`;

        if (!isNaN(peakPower) && peakPower > 0) {
            const avgPowerW  = peakPower * dutyCycle;
            const peakPwrDbw = 10 * Math.log10(peakPower);
            html += `
                <div class="result-item">
                    <strong>Power:</strong>
                    <ul>
                        <li>Peak power = ${formatNumber(peakPower, 0)} W (${formatNumber(peakPwrDbw, 1)} dBW)</li>
                        <li>Average power = ${formatNumber(avgPowerW, 3)} W</li>
                        <li>P_avg / P_peak = ${formatNumber(dutyCycle, 5)}</li>
                    </ul>
                </div>`;
        }

        if (!isNaN(frequency) && frequency > 0) {
            const freqHz     = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
            const lambdaM    = CONSTANTS.SPEED_OF_LIGHT / freqHz;
            const maxVelMs   = lambdaM * prf / 2;   // ±v_max (unambiguous)
            const velResMs   = lambdaM / (2 * priSec); // single-pulse (no CPI)
            html += `
                <div class="result-item">
                    <strong>Velocity (Doppler):</strong>
                    <ul>
                        <li>Max unambig. vel = ±${formatNumber(maxVelMs, 2)} m/s</li>
                        <li>Max unambig. vel = ±${formatNumber(maxVelMs * 3.6, 2)} km/h</li>
                        <li>Max unambig. vel = ±${formatNumber(maxVelMs * 1.944, 2)} knots</li>
                        <li>Velocity resolution = ${formatNumber(velResMs, 2)} m/s</li>
                    </ul>
                </div>`;
        }

        html += `</div>
            <div class="info-section">
                <p><strong>Range–Velocity Ambiguity (Doppler Dilemma):</strong></p>
                <ul>
                    <li>High PRF → good velocity coverage, but range is ambiguous</li>
                    <li>Low PRF → good range coverage, but velocity is ambiguous</li>
                    <li>Medium PRF → both ambiguous; resolved with staggered PRF or MFPRF</li>
                    <li>Range × velocity unambiguous product = c · λ / 8 (constant for a given λ)</li>
                </ul>
            </div>`;

        document.getElementById('radar-pulse-results').innerHTML = html;

    } catch (error) {
        document.getElementById('radar-pulse-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ELECTRONIC WARFARE — JAMMING / BURN-THROUGH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Electronic Warfare: J/S ratio and burn-through range (self-screening jammer model)
 */
function calculateEW() {
    const radarPowerKw = parseFloat(document.getElementById('ew-radar-power').value);
    const radarGainDb  = parseFloat(document.getElementById('ew-radar-gain').value);
    const rcsRaw       = parseFloat(document.getElementById('ew-rcs').value);
    const rcsUnit      = document.getElementById('ew-rcs-unit').value;
    const jamPowerKw   = parseFloat(document.getElementById('ew-jam-power').value);
    const jamGainDb    = parseFloat(document.getElementById('ew-jam-gain').value);
    const snrMinDb     = parseFloat(document.getElementById('ew-snr').value) || 13;

    if (!validateInput(radarPowerKw)) {
        showError('ew-radar-power', 'Please enter a valid radar power');
        return;
    }
    if (!validateInput(jamPowerKw)) {
        showError('ew-jam-power', 'Please enter a valid jammer power');
        return;
    }
    if (isNaN(rcsRaw)) {
        showError('ew-rcs', 'Please enter a valid RCS value');
        return;
    }
    clearError('ew-radar-power');
    clearError('ew-jam-power');
    clearError('ew-rcs');

    try {
        const radarPowerW   = radarPowerKw * 1e3;
        const jamPowerW     = jamPowerKw   * 1e3;
        const rcsM2         = rcsToM2(rcsRaw, rcsUnit);
        const radarGainLin  = Math.pow(10, radarGainDb / 10);
        const jamGainLin    = Math.pow(10, jamGainDb   / 10);
        const snrMinLin     = Math.pow(10, snrMinDb    / 10);

        // Burn-through range — range at which radar SNR equals jammer-to-signal
        // R_bt = sqrt[ P_t · G_t · σ / (4π · P_j · G_j) ]
        const burnThroughM  = Math.sqrt(
            (radarPowerW * radarGainLin * rcsM2) /
            (4 * Math.PI * jamPowerW * jamGainLin)
        );
        const burnThroughKm = burnThroughM / 1000;

        // Self-screening jammer effective screen range
        // J/S = S/N_min → R_screen = sqrt[ P_t · G_t · σ / (4π · P_j · G_j · SNR_min) ]
        const screenRangeM  = Math.sqrt(
            (radarPowerW * radarGainLin * rcsM2) /
            (4 * Math.PI * jamPowerW * jamGainLin * snrMinLin)
        );
        const screenRangeKm = screenRangeM / 1000;

        // J/S ratio at reference range of 100 km
        const ref100km     = 100e3;
        const jsAt100kmDb  = 10 * Math.log10(
            (jamPowerW * jamGainLin * 4 * Math.PI * ref100km * ref100km) /
            (radarPowerW * radarGainLin * rcsM2)
        );

        const radarErpDbw  = 10 * Math.log10(radarPowerW * radarGainLin);
        const jamErpDbw    = 10 * Math.log10(jamPowerW   * jamGainLin);

        const html = `
            <h4>Electronic Warfare Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Burn-Through Range:</strong>
                    <ul>
                        <li>R_bt = ${formatNumber(burnThroughKm, 2)} km</li>
                        <li>R_bt = ${formatNumber(burnThroughKm / 1.852, 2)} nm</li>
                        <li>Within R_bt: radar sees target despite jamming</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Jammer Performance:</strong>
                    <ul>
                        <li>J/S at 100 km = ${formatNumber(jsAt100kmDb, 1)} dB</li>
                        <li>SSJ screen range = ${formatNumber(screenRangeKm, 2)} km</li>
                        <li>Jammer ERP = ${formatNumber(jamErpDbw, 1)} dBW</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Radar Parameters:</strong>
                    <ul>
                        <li>Radar ERP = ${formatNumber(radarErpDbw, 1)} dBW</li>
                        <li>Target RCS = ${formatNumber(rcsM2, 4)} m² (${formatNumber(10 * Math.log10(rcsM2), 2)} dBsm)</li>
                        <li>Required S/N = ${formatNumber(snrMinDb, 1)} dB</li>
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>Key EW Concepts:</strong></p>
                <ul>
                    <li><strong>Burn-Through:</strong> Range where radar SNR = jammer J/S ratio; radar "sees through" jamming</li>
                    <li><strong>SSJ (Self-Screening):</strong> Target carries its own jammer (e.g. aircraft with pod)</li>
                    <li><strong>SOJ (Stand-Off):</strong> Dedicated EW aircraft maintains safe standoff distance</li>
                    <li>J/S &gt; 0 dB: jamming is effective — J/S &lt; 0 dB: radar wins</li>
                    <li>LPI waveforms (spread spectrum, low sidelobe) reduce susceptibility</li>
                </ul>
            </div>`;

        document.getElementById('ew-results').innerHTML = html;

    } catch (error) {
        document.getElementById('ew-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SATELLITE ORBITAL PARAMETERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load a satellite altitude preset into the input field
 */
function loadSatellitePreset() {
    const presets = { iss: 408, starlink: 550, iridium: 780, gps: 20200, geo: 35786 };
    const val = document.getElementById('sat-preset').value;
    if (presets[val] !== undefined) {
        document.getElementById('sat-altitude').value = presets[val];
    }
}

/**
 * Orbital period, velocity, coverage, and pass duration for a circular orbit
 */
function calculateOrbitalParameters() {
    const altKm = parseFloat(document.getElementById('sat-altitude').value);

    if (!validateInput(altKm, 100)) {
        showError('sat-altitude', 'Altitude must be at least 100 km');
        return;
    }
    clearError('sat-altitude');

    try {
        const Re   = EARTH_RADIUS_KM;           // km
        const r    = Re + altKm;                // orbit radius km
        const rM   = r * 1e3;                   // metres

        // Orbital period T = 2π √(r³/GM)
        const periodSec = 2 * Math.PI * Math.sqrt(Math.pow(rM, 3) / EARTH_GM);
        const periodMin = periodSec / 60;

        // Orbital velocity v = √(GM/r)
        const velMs  = Math.sqrt(EARTH_GM / rM);
        const velKms = velMs / 1000;

        // Max Doppler fraction (when satellite passes directly overhead)
        const dopplerFrac = velMs / CONSTANTS.SPEED_OF_LIGHT;

        // Earth central angle for ε = 0° (geometric horizon)
        const halfAngle0Deg = Math.acos(Re / r) * 180 / Math.PI;
        const footprintKm2  = 2 * Math.PI * Re * Re * (1 - Math.cos(halfAngle0Deg * Math.PI / 180));
        const coveragePct   = footprintKm2 / (4 * Math.PI * Re * Re) * 100;

        // Earth central angle for ε = 5° (practical minimum elevation)
        const elev5Rad        = 5 * Math.PI / 180;
        const earthCentral5   = Math.PI / 2 - elev5Rad - Math.asin(Re / r * Math.cos(elev5Rad));
        const coverageR5Km    = Re * Math.abs(earthCentral5);
        const maxPassMin5     = (2 * Math.abs(earthCentral5) * 180 / Math.PI / 360) * periodMin;

        // Slant range to horizon (ε = 0°)
        const horizonSlantKm = Math.sqrt(rM * rM - (Re * 1e3) * (Re * 1e3)) / 1e3;

        // Orbit classification
        let orbitType;
        if (altKm < 2000)       orbitType = 'LEO — Low Earth Orbit';
        else if (altKm < 20200) orbitType = 'MEO — Medium Earth Orbit';
        else if (altKm < 35286) orbitType = 'Sub-GEO';
        else if (altKm < 36286) orbitType = 'GEO — Geostationary';
        else                    orbitType = 'Super-GEO / HEO';

        let html = `
            <h4>Orbital Parameter Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Orbit:</strong>
                    <ul>
                        <li>Altitude = ${formatNumber(altKm, 0)} km</li>
                        <li>Orbit radius = ${formatNumber(r, 0)} km</li>
                        <li>Period = ${formatNumber(periodMin, 2)} min</li>
                        <li>Period = ${formatNumber(periodMin / 60, 3)} hr</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Velocity &amp; Doppler:</strong>
                    <ul>
                        <li>Orbital velocity = ${formatNumber(velKms, 3)} km/s</li>
                        <li>Max Doppler = ±${formatNumber(dopplerFrac * 1e6, 2)} ppm</li>
                        <li>At 12 GHz: ±${formatNumber(dopplerFrac * 12e9 / 1e6, 2)} MHz</li>
                        <li>At 2 GHz:  ±${formatNumber(dopplerFrac * 2e9 / 1e6, 3)} MHz</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Coverage (ε = 0°):</strong>
                    <ul>
                        <li>Half-angle = ${formatNumber(halfAngle0Deg, 2)}°</li>
                        <li>Footprint = ${formatNumber(footprintKm2 / 1e6, 2)} M km²</li>
                        <li>Earth coverage = ${formatNumber(coveragePct, 2)}%</li>
                        <li>Horizon slant = ${formatNumber(horizonSlantKm, 0)} km</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Coverage (ε = 5°):</strong>
                    <ul>
                        <li>Coverage radius = ${formatNumber(coverageR5Km, 0)} km</li>
                        <li>Max pass duration = ${formatNumber(maxPassMin5, 2)} min</li>
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>Orbit type:</strong> ${orbitType}</p>
                ${altKm >= 540 && altKm <= 570 ? '<p>📡 <strong>Starlink Shell 1 altitude</strong> (~550 km, Ku/Ka band, 53° inclination)</p>' : ''}
                <ul>
                    <li>Starlink: 340–570 km LEO — 12,000+ satellites in multiple shells</li>
                    <li>ISS: ~408 km LEO — 51.6° inclination</li>
                    <li>GPS: ~20,200 km MEO — 55° inclination, 6 planes × 4 slots</li>
                    <li>GEO: 35,786 km — appears stationary; 3 satellites cover most of Earth</li>
                </ul>
            </div>`;

        document.getElementById('orbital-results').innerHTML = html;

    } catch (error) {
        document.getElementById('orbital-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SATELLITE LINK BUDGET  (Starlink / LEO / GEO)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Satellite link budget: EIRP, FSPL, C/N₀, Eb/N₀
 * C/N₀ = EIRP + G/T − FSPL − L_atm − L_pt − k   (all in dB / dB·Hz / dB/K)
 */
function calculateSatelliteLinkBudget() {
    const frequency  = parseFloat(document.getElementById('slb-freq').value);
    const freqUnit   = document.getElementById('slb-freq-unit').value;
    const altKm      = parseFloat(document.getElementById('slb-altitude').value);
    const txPowerDbw = parseFloat(document.getElementById('slb-tx-power').value);
    const txGainDb   = parseFloat(document.getElementById('slb-tx-gain').value);
    const rxGtDb     = parseFloat(document.getElementById('slb-rx-gt').value);
    const elevDeg    = parseFloat(document.getElementById('slb-elevation').value) || 45;
    const atmosLoss  = parseFloat(document.getElementById('slb-atmos-loss').value) || 0.5;
    const pointLoss  = parseFloat(document.getElementById('slb-point-loss').value) || 0.5;

    if (!validateInput(frequency)) {
        showError('slb-freq', 'Please enter a valid frequency');
        return;
    }
    if (!validateInput(altKm, 100)) {
        showError('slb-altitude', 'Please enter a valid altitude (≥ 100 km)');
        return;
    }
    if (isNaN(txPowerDbw) || isNaN(txGainDb) || isNaN(rxGtDb)) {
        showError('slb-tx-power', 'Please enter valid power, gain, and G/T values');
        return;
    }
    clearError('slb-freq');
    clearError('slb-altitude');
    clearError('slb-tx-power');

    try {
        const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
        const Re     = EARTH_RADIUS_KM;
        const h      = altKm;

        // Slant range from elevation angle and altitude
        // r_s = −R_e·sin(ε) + √(R_e²·sin²(ε) + h·(2·R_e + h))
        const elevRad     = elevDeg * Math.PI / 180;
        const slantKm     = -Re * Math.sin(elevRad) +
            Math.sqrt(Re * Re * Math.sin(elevRad) * Math.sin(elevRad) + h * (2 * Re + h));
        const slantM      = slantKm * 1e3;

        // Free Space Path Loss
        const fsplDb  = 20 * Math.log10(slantM) + 20 * Math.log10(freqHz) +
                        20 * Math.log10(4 * Math.PI / CONSTANTS.SPEED_OF_LIGHT);

        // EIRP  =  P_t + G_t  (dBW + dBi)
        const eirpDb  = txPowerDbw + txGainDb;

        // Boltzmann constant in dBW/Hz/K  =  10·log10(1.380649×10⁻²³)  ≈ −228.6
        const kDb     = 10 * Math.log10(BOLTZMANN_K);

        // C/N₀  =  EIRP + G/T − FSPL − L_atm − L_pt − k
        const cn0Db   = eirpDb + rxGtDb - fsplDb - atmosLoss - pointLoss - kDb;

        // Received isotropic power level (without G/T)
        const rxIsoPowDb = eirpDb - fsplDb - atmosLoss - pointLoss;

        // Eb/N₀ at representative bit rates
        const ebno = (rate) => cn0Db - 10 * Math.log10(rate);

        let html = `
            <h4>Satellite Link Budget Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Geometry:</strong>
                    <ul>
                        <li>Altitude = ${formatNumber(altKm, 0)} km</li>
                        <li>Elevation angle = ${formatNumber(elevDeg, 1)}°</li>
                        <li>Slant range = ${formatNumber(slantKm, 1)} km</li>
                        <li>Band: ${getRadarBandName(freqHz)}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Transmitter (EIRP):</strong>
                    <ul>
                        <li>P_t = ${formatNumber(txPowerDbw, 1)} dBW</li>
                        <li>Tx gain = ${formatNumber(txGainDb, 1)} dBi</li>
                        <li>EIRP = ${formatNumber(eirpDb, 1)} dBW</li>
                        <li>FSPL = ${formatNumber(fsplDb, 1)} dB</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Received Power:</strong>
                    <ul>
                        <li>Atmos. loss = ${formatNumber(atmosLoss, 1)} dB</li>
                        <li>Pointing loss = ${formatNumber(pointLoss, 1)} dB</li>
                        <li>Rx isotropic = ${formatNumber(rxIsoPowDb, 1)} dBW</li>
                        <li>Rx G/T = ${formatNumber(rxGtDb, 1)} dB/K</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Link Quality:</strong>
                    <ul>
                        <li>C/N₀ = ${formatNumber(cn0Db, 1)} dB·Hz</li>
                        <li>Eb/N₀ @ 1 Mbps = ${formatNumber(ebno(1e6), 1)} dB</li>
                        <li>Eb/N₀ @ 10 Mbps = ${formatNumber(ebno(10e6), 1)} dB</li>
                        <li>Eb/N₀ @ 100 Mbps = ${formatNumber(ebno(100e6), 1)} dB</li>
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>C/N₀ = EIRP + G/T − FSPL − L_atm − L_pt − k</strong></p>
                <ul>
                    <li>Starlink user terminal Ku downlink: ~10.7–12.7 GHz, EIRP ≈ +70 dBW, G/T ≈ +14 dB/K</li>
                    <li>Typical Eb/N₀ thresholds: BPSK 9.6 dB, QPSK 6.6 dB, 16QAM 15.6 dB (10⁻⁶ BER)</li>
                    <li>Add 3–10 dB rain fade margin at Ku band; 10–20 dB at Ka band</li>
                    <li>k = Boltzmann = ${formatNumber(kDb, 1)} dBW/Hz/K</li>
                </ul>
            </div>`;

        document.getElementById('slb-results').innerHTML = html;

    } catch (error) {
        document.getElementById('slb-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SATELLITE CONSTELLATION COVERAGE  (Stellate Communications)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Satellite constellation coverage analysis
 * Computes single-satellite footprint, minimum satellites for global coverage,
 * and (optionally) total constellation statistics for a user-defined Walker-like
 * constellation — the basis of Starlink, OneWeb, and similar "stellate" networks.
 */
function calculateConstellationCoverage() {
    const altKm       = parseFloat(document.getElementById('const-altitude').value);
    const minElevDeg  = parseFloat(document.getElementById('const-min-elev').value) || 10;
    const numPlanes   = parseFloat(document.getElementById('const-planes').value);
    const satsPerPlane= parseFloat(document.getElementById('const-sats-per-plane').value);

    if (!validateInput(altKm, 100)) {
        showError('const-altitude', 'Altitude must be at least 100 km');
        return;
    }
    clearError('const-altitude');

    try {
        const Re    = EARTH_RADIUS_KM;
        const r     = Re + altKm;
        const rM    = r * 1e3;
        const elevRad = minElevDeg * Math.PI / 180;

        // Earth central angle λ = 90° − ε − arcsin(R_e/r · cos ε)
        const lambda      = Math.PI / 2 - elevRad - Math.asin(Re / r * Math.cos(elevRad));
        const lambdaDeg   = lambda * 180 / Math.PI;

        // Coverage area per satellite (spherical cap)
        const capKm2      = 2 * Math.PI * Re * Re * (1 - Math.cos(lambda));
        const earthKm2    = 4 * Math.PI * Re * Re;
        const coveragePct = capKm2 / earthKm2 * 100;

        // Minimum satellites for continuous global coverage (theoretical optimum)
        // N_min = ceil(2 / (1 − cos λ))   — Walker constellation bound
        const minSats     = Math.ceil(2 / (1 - Math.cos(lambda)));

        // Orbital period
        const periodSec   = 2 * Math.PI * Math.sqrt(Math.pow(rM, 3) / EARTH_GM);
        const periodMin   = periodSec / 60;

        // Constellation statistics (if user provided planes & sats per plane)
        const hasConst    = !isNaN(numPlanes) && numPlanes >= 1 &&
                            !isNaN(satsPerPlane) && satsPerPlane >= 1;
        const totalSats   = hasConst ? numPlanes * satsPerPlane : null;

        // Approximate revisit time for polar/near-polar Walker constellation
        // Revisit ≈ period / sats_per_plane  (time between consecutive passes over a point)
        const revisitMin  = hasConst ? periodMin / satsPerPlane : null;

        // Slant range at minimum elevation
        const slantAtMinElevKm = -Re * Math.sin(elevRad) +
            Math.sqrt(Re * Re * Math.sin(elevRad) * Math.sin(elevRad) + altKm * (2 * Re + altKm));

        let html = `
            <h4>Satellite Constellation Coverage Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Single Satellite Footprint:</strong>
                    <ul>
                        <li>Altitude = ${formatNumber(altKm, 0)} km</li>
                        <li>Min elevation = ${formatNumber(minElevDeg, 1)}°</li>
                        <li>Earth central angle λ = ${formatNumber(lambdaDeg, 2)}°</li>
                        <li>Coverage radius ≈ ${formatNumber(Re * lambda, 0)} km</li>
                        <li>Footprint area = ${formatNumber(capKm2 / 1e6, 2)} M km²</li>
                        <li>% of Earth surface = ${formatNumber(coveragePct, 2)}%</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Global Coverage:</strong>
                    <ul>
                        <li>Min sats (theoretical) = ${minSats}</li>
                        <li>Orbital period = ${formatNumber(periodMin, 2)} min</li>
                        <li>Slant range @ ε_min = ${formatNumber(slantAtMinElevKm, 0)} km</li>
                    </ul>
                </div>
                ${hasConst ? `
                <div class="result-item">
                    <strong>Your Constellation:</strong>
                    <ul>
                        <li>Orbital planes = ${numPlanes}</li>
                        <li>Sats per plane = ${satsPerPlane}</li>
                        <li>Total satellites = ${totalSats}</li>
                        <li>Revisit time ≈ ${formatNumber(revisitMin, 1)} min</li>
                        <li>${totalSats >= minSats ? '✅ Sufficient for global coverage' : `⚠ Need ~${minSats} sats for global coverage`}</li>
                    </ul>
                </div>` : ''}
            </div>
            <div class="info-section">
                <p><strong>Satellite Constellation Examples:</strong></p>
                <ul>
                    <li><strong>Starlink (SpaceX):</strong> 340–570 km, 72 planes × 22 sats (Shell 1, 53°), 12,000+ total planned</li>
                    <li><strong>OneWeb:</strong> 1,200 km, 18 planes × 36 sats = 648 sats (87.9° inclination)</li>
                    <li><strong>Iridium NEXT:</strong> 780 km, 6 planes × 11 sats = 66 sats (86.4° inclination)</li>
                    <li><strong>GPS:</strong> 20,200 km, 6 planes × 4 sats = 24 operational (55° inclination)</li>
                    <li><strong>GEO (3-satellite):</strong> 35,786 km — 3 properly spaced satellites cover ~95% of populated areas</li>
                </ul>
            </div>`;

        document.getElementById('constellation-results').innerHTML = html;

    } catch (error) {
        document.getElementById('constellation-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}
