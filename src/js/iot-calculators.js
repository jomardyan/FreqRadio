// IoT Communications Calculator Functions

// ─────────────────────────────────────────────────────────────────────────────
// IoT Technology Reference Data
// ─────────────────────────────────────────────────────────────────────────────

// LoRa spreading factor SNR thresholds and typical sensitivities
const LORA_SF_DATA = {
    7:  { snrDb: -7.5,  sensitivity125: -124, sensitivity250: -121, sensitivity500: -118, ldrRequired: false },
    8:  { snrDb: -10,   sensitivity125: -127, sensitivity250: -124, sensitivity500: -121, ldrRequired: false },
    9:  { snrDb: -12.5, sensitivity125: -130, sensitivity250: -127, sensitivity500: -124, ldrRequired: false },
    10: { snrDb: -15,   sensitivity125: -133, sensitivity250: -130, sensitivity500: -127, ldrRequired: false },
    11: { snrDb: -17.5, sensitivity125: -135, sensitivity250: -132, sensitivity500: -129, ldrRequired: true  },
    12: { snrDb: -20,   sensitivity125: -137, sensitivity250: -134, sensitivity500: -131, ldrRequired: true  }
};

// IoT technology reference parameters
const IOT_TECH_DATA = [
    { id: 'lora_sf12',  name: 'LoRa SF12 (125 kHz)',      freqMHz: 868,   txDbm: 14,  sensitivityDbm: -137, antGainTxDbi: 2.1, antGainRxDbi: 2.1, dataRateKbps: 0.25,   rangeIndoor: '1–5 km',    rangeOutdoor: '5–20 km',  powerClass: 'Low',        notes: 'LPWAN; max range / min data rate' },
    { id: 'lora_sf7',   name: 'LoRa SF7 (125 kHz)',       freqMHz: 868,   txDbm: 14,  sensitivityDbm: -124, antGainTxDbi: 2.1, antGainRxDbi: 2.1, dataRateKbps: 5.47,   rangeIndoor: '0.5–2 km',  rangeOutdoor: '1–5 km',   powerClass: 'Low',        notes: 'LPWAN; min ToA / max data rate' },
    { id: 'nbiot',      name: 'NB-IoT',                    freqMHz: 900,   txDbm: 23,  sensitivityDbm: -114, antGainTxDbi: 0,   antGainRxDbi: 0,   dataRateKbps: 62.5,   rangeIndoor: '1–10 km',   rangeOutdoor: '5–35 km',  powerClass: 'Low',        notes: 'Cellular; MCL ~164 dB; good indoor penetration' },
    { id: 'ltem',       name: 'LTE-M (Cat-M1)',            freqMHz: 900,   txDbm: 23,  sensitivityDbm: -106, antGainTxDbi: 0,   antGainRxDbi: 0,   dataRateKbps: 1000,   rangeIndoor: '1–5 km',    rangeOutdoor: '3–15 km',  powerClass: 'Medium',     notes: 'Cellular; MCL ~156 dB; supports voice + mobility' },
    { id: 'sigfox',     name: 'Sigfox',                    freqMHz: 868,   txDbm: 14,  sensitivityDbm: -130, antGainTxDbi: 2.1, antGainRxDbi: 2.1, dataRateKbps: 0.1,    rangeIndoor: '3–10 km',   rangeOutdoor: '10–50 km', powerClass: 'Very Low',   notes: 'LPWAN; 140 msg/day limit; 12-byte payload' },
    { id: 'ble5',       name: 'BLE 5.0 (1M PHY)',          freqMHz: 2400,  txDbm: 0,   sensitivityDbm: -96,  antGainTxDbi: 0,   antGainRxDbi: 0,   dataRateKbps: 1000,   rangeIndoor: '10–50 m',   rangeOutdoor: '50–400 m', powerClass: 'Very Low',   notes: 'Short range; BLE 5.0 ×4 range vs 4.2' },
    { id: 'ble5_lr',    name: 'BLE 5.0 Long Range (125k)', freqMHz: 2400,  txDbm: 0,   sensitivityDbm: -103, antGainTxDbi: 0,   antGainRxDbi: 0,   dataRateKbps: 0.125,  rangeIndoor: '50–200 m',  rangeOutdoor: '200 m–1 km', powerClass: 'Very Low', notes: 'Coded PHY (S=8); 4× range, 1/8 data rate' },
    { id: 'zigbee',     name: 'Zigbee (IEEE 802.15.4)',     freqMHz: 2400,  txDbm: 0,   sensitivityDbm: -100, antGainTxDbi: 0,   antGainRxDbi: 0,   dataRateKbps: 250,    rangeIndoor: '10–30 m',   rangeOutdoor: '30–200 m', powerClass: 'Low',        notes: 'Mesh networking; ZigBee 3.0 interop' },
    { id: 'thread',     name: 'Thread / Matter (802.15.4)', freqMHz: 2400,  txDbm: 0,   sensitivityDbm: -100, antGainTxDbi: 0,   antGainRxDbi: 0,   dataRateKbps: 250,    rangeIndoor: '10–30 m',   rangeOutdoor: '30–200 m', powerClass: 'Low',        notes: 'IPv6 mesh; Matter smart home standard' },
    { id: 'zwave',      name: 'Z-Wave (EU)',                freqMHz: 868,   txDbm: 5,   sensitivityDbm: -102, antGainTxDbi: 0,   antGainRxDbi: 0,   dataRateKbps: 100,    rangeIndoor: '10–30 m',   rangeOutdoor: '30–100 m', powerClass: 'Low',        notes: 'Sub-GHz mesh; 868 MHz (EU) / 908 MHz (US)' },
    { id: 'wifi_halow', name: 'Wi-Fi HaLow (802.11ah)',     freqMHz: 900,   txDbm: 30,  sensitivityDbm: -95,  antGainTxDbi: 2.1, antGainRxDbi: 2.1, dataRateKbps: 7800,   rangeIndoor: '50–200 m',  rangeOutdoor: '200 m–1 km', powerClass: 'High',     notes: 'Sub-GHz Wi-Fi; long range; IP to every device' },
    { id: 'wifi_24',    name: 'Wi-Fi 2.4 GHz (802.11n)',    freqMHz: 2400,  txDbm: 20,  sensitivityDbm: -90,  antGainTxDbi: 2.1, antGainRxDbi: 2.1, dataRateKbps: 150000, rangeIndoor: '20–50 m',   rangeOutdoor: '50–250 m', powerClass: 'High',       notes: 'Ubiquitous; high power; not ideal for battery IoT' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Free Space Path Loss in dB
 * FSPL = 20·log10(d) + 20·log10(f) + 20·log10(4π/c)
 */
function iotFSPL(distanceM, freqHz) {
    return 20 * Math.log10(distanceM) +
           20 * Math.log10(freqHz) +
           20 * Math.log10(4 * Math.PI / CONSTANTS.SPEED_OF_LIGHT);
}

/**
 * Maximum range from link budget
 * R_max = 10^((EIRP - sensitivity + Gr - margins) / 20) × c / (4π·f)
 */
function iotMaxRange(txDbm, antGainTxDbi, sensitivityDbm, antGainRxDbi, freqHz, marginDb) {
    const linkMarginDb = txDbm + antGainTxDbi - sensitivityDbm + antGainRxDbi - marginDb;
    return Math.pow(10, linkMarginDb / 20) * CONSTANTS.SPEED_OF_LIGHT / (4 * Math.PI * freqHz);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LoRa / LoRaWAN Calculator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LoRa Time on Air per Semtech AN1200.13
 * Returns complete packet timing and link budget.
 */
function calculateLoRa() {
    const sf        = parseInt(document.getElementById('lora-sf').value, 10);
    const bwKHz     = parseFloat(document.getElementById('lora-bw').value);
    const cr        = parseInt(document.getElementById('lora-cr').value, 10);   // 1=4/5 … 4=4/8
    const pl        = parseInt(document.getElementById('lora-payload').value, 10);
    const nPreamble = parseInt(document.getElementById('lora-preamble').value, 10) || 8;
    const crc       = document.getElementById('lora-crc').checked ? 1 : 0;
    const ih        = document.getElementById('lora-ih').checked  ? 1 : 0;  // implicit header
    const txDbm     = parseFloat(document.getElementById('lora-tx-power').value);
    const freqMHz   = parseFloat(document.getElementById('lora-freq').value);
    const nfDb      = parseFloat(document.getElementById('lora-nf').value) || 6;

    if (isNaN(sf) || sf < 7 || sf > 12) {
        showError('lora-sf', 'SF must be 7–12');
        return;
    }
    if (!validateInput(pl)) {
        showError('lora-payload', 'Please enter a valid payload length');
        return;
    }
    if (!validateInput(bwKHz)) {
        showError('lora-bw', 'Please enter a valid bandwidth');
        return;
    }
    if (isNaN(txDbm)) {
        showError('lora-tx-power', 'Please enter a valid TX power');
        return;
    }
    clearError('lora-sf');
    clearError('lora-payload');
    clearError('lora-bw');
    clearError('lora-tx-power');

    try {
        const bwHz   = bwKHz * 1e3;
        const sfData = LORA_SF_DATA[sf];

        // Low Data Rate Optimization required when T_sym ≥ 16 ms
        const tSymMs = (Math.pow(2, sf) / bwHz) * 1e3;
        const de     = (tSymMs >= 16 || sfData.ldrRequired) ? 1 : 0;

        // Preamble duration
        const tPreambleMs = (nPreamble + 4.25) * tSymMs;

        // Number of payload symbols
        const numerator    = 8 * pl - 4 * sf + 28 + 16 * crc - 20 * ih;
        const denominator  = 4 * (sf - 2 * de);
        const payloadSymNb = 8 + Math.max(Math.ceil(numerator / denominator) * (cr + 4), 0);
        const tPayloadMs   = payloadSymNb * tSymMs;

        // Total time on air
        const toaMs  = tPreambleMs + tPayloadMs;
        const toaSec = toaMs / 1e3;

        // Sensitivity: −174 + NF + 10·log10(BW) + SNR_min
        const sensitivityDbm = -174 + nfDb + 10 * Math.log10(bwHz) + sfData.snrDb;

        // Link budget
        const freqHz     = freqMHz * 1e6;
        const eirpDbm    = txDbm + 2.1; // assume 2.1 dBi dipole
        const linkBudget = eirpDbm - sensitivityDbm; // total available margin

        // Max range (FSPL, 0 dB margin, 2.1 dBi gain each end)
        const maxRangeM   = iotMaxRange(txDbm, 2.1, sensitivityDbm, 2.1, freqHz, 0);
        const maxRangeKm  = maxRangeM / 1000;

        // EU868 duty cycle check (1% for most sub-bands)
        const txPerHour_1pct  = Math.floor(3600 * 0.01 / toaSec);
        const txPerDay_1pct   = txPerHour_1pct * 24;

        // Data rate
        const dataRateBps = sf * (4 / (4 + cr)) * bwHz / Math.pow(2, sf);

        // Equivalent bits per second considering overhead
        const effectiveBps = (pl * 8) / toaSec;

        const bwLabel = bwKHz === 125 ? '125 kHz' : bwKHz === 250 ? '250 kHz' : `${bwKHz} kHz`;

        const html = `
            <h4>LoRa / LoRaWAN Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Time on Air:</strong>
                    <ul>
                        <li>Symbol duration = ${formatNumber(tSymMs, 3)} ms</li>
                        <li>Preamble = ${formatNumber(tPreambleMs, 3)} ms</li>
                        <li>Payload symbols = ${payloadSymNb}</li>
                        <li><strong>Total ToA = ${formatNumber(toaMs, 2)} ms</strong></li>
                        <li>LDR Optimize: ${de ? '✅ Enabled' : '❌ Not needed'}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Data Rate:</strong>
                    <ul>
                        <li>Raw bit rate = ${formatNumber(dataRateBps / 1000, 3)} kbps</li>
                        <li>Effective rate = ${formatNumber(effectiveBps, 1)} bps</li>
                        <li>SF${sf}, ${bwLabel}, CR 4/${cr + 4}</li>
                        <li>Payload = ${pl} bytes, CRC ${crc ? 'ON' : 'OFF'}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Receiver Sensitivity:</strong>
                    <ul>
                        <li>Noise figure = ${formatNumber(nfDb, 1)} dB</li>
                        <li>SNR threshold = ${sfData.snrDb} dB</li>
                        <li>Sensitivity = ${formatNumber(sensitivityDbm, 1)} dBm</li>
                        <li>TX power = ${formatNumber(txDbm, 1)} dBm</li>
                        <li>Link budget = ${formatNumber(linkBudget, 1)} dB</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Range &amp; Duty Cycle:</strong>
                    <ul>
                        <li>Max range (0 dB margin) = ${formatNumber(maxRangeKm, 2)} km</li>
                        <li>Max range (10 dB margin) = ${formatNumber(iotMaxRange(txDbm, 2.1, sensitivityDbm, 2.1, freqHz, 10) / 1000, 2)} km</li>
                        <li>EU868 1% limit: ${txPerHour_1pct} msg/hr (${txPerDay_1pct}/day)</li>
                        <li>Airtime budget @ 1% = ${formatNumber(36, 0)} s/hr</li>
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>SF Comparison (${bwLabel}, same settings):</strong></p>
                <table class="iot-comparison-table">
                    <tr><th>SF</th><th>ToA (ms)</th><th>Sensitivity (dBm)</th><th>Max Range (km)</th><th>Msgs/hr (1%)</th></tr>
                    ${[7,8,9,10,11,12].map(s => {
                        const sd = LORA_SF_DATA[s];
                        const tSym = (Math.pow(2, s) / bwHz) * 1e3;
                        const deS = (tSym >= 16 || sd.ldrRequired) ? 1 : 0;
                        const num = 8 * pl - 4 * s + 28 + 16 * crc - 20 * ih;
                        const den = 4 * (s - 2 * deS);
                        const pSym = 8 + Math.max(Math.ceil(num / den) * (cr + 4), 0);
                        const tTot = (nPreamble + 4.25) * tSym + pSym * tSym;
                        const sens = -174 + nfDb + 10 * Math.log10(bwHz) + sd.snrDb;
                        const rng = iotMaxRange(txDbm, 2.1, sens, 2.1, freqHz, 10) / 1000;
                        const mhr = Math.floor(3600 * 0.01 / (tTot / 1000));
                        return `<tr ${s === sf ? 'class="highlight-row"' : ''}><td>SF${s}</td><td>${formatNumber(tTot, 1)}</td><td>${formatNumber(sens, 1)}</td><td>${formatNumber(rng, 2)}</td><td>${mhr}</td></tr>`;
                    }).join('')}
                </table>
                <ul>
                    <li>Higher SF → longer range, higher sensitivity, but much longer time on air</li>
                    <li>ToA doubles for each SF increase — SF12 ToA is 64× longer than SF7</li>
                    <li>LoRaWAN Class A: 2 RX windows opened after each uplink</li>
                    <li>EU868: 1% duty cycle on most sub-bands (10 mW channels)</li>
                </ul>
            </div>`;

        document.getElementById('lora-results').innerHTML = html;

    } catch (error) {
        document.getElementById('lora-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. IoT Link Budget
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load an IoT technology preset into the link budget form
 */
function loadIoTPreset() {
    const id   = document.getElementById('iot-lb-preset').value;
    const tech = IOT_TECH_DATA.find(t => t.id === id);
    if (!tech) return;

    document.getElementById('iot-lb-freq').value        = tech.freqMHz;
    document.getElementById('iot-lb-tx-power').value    = tech.txDbm;
    document.getElementById('iot-lb-sensitivity').value = tech.sensitivityDbm;
    document.getElementById('iot-lb-tx-gain').value     = tech.antGainTxDbi;
    document.getElementById('iot-lb-rx-gain').value     = tech.antGainRxDbi;
}

/**
 * Generic IoT Link Budget calculator
 * Computes max range for indoor and outdoor environments using FSPL + typical shadowing margin.
 */
function calculateIoTLinkBudget() {
    const freqMHz    = parseFloat(document.getElementById('iot-lb-freq').value);
    const txDbm      = parseFloat(document.getElementById('iot-lb-tx-power').value);
    const sensDbm    = parseFloat(document.getElementById('iot-lb-sensitivity').value);
    const txGainDbi  = parseFloat(document.getElementById('iot-lb-tx-gain').value)  || 0;
    const rxGainDbi  = parseFloat(document.getElementById('iot-lb-rx-gain').value)  || 0;
    const feederLoss = parseFloat(document.getElementById('iot-lb-feeder').value)   || 0;
    const marginDb   = parseFloat(document.getElementById('iot-lb-margin').value)   || 10;

    if (!validateInput(freqMHz)) {
        showError('iot-lb-freq', 'Please enter a valid frequency');
        return;
    }
    if (isNaN(txDbm)) {
        showError('iot-lb-tx-power', 'Please enter a valid TX power');
        return;
    }
    if (isNaN(sensDbm)) {
        showError('iot-lb-sensitivity', 'Please enter a valid sensitivity');
        return;
    }
    clearError('iot-lb-freq');
    clearError('iot-lb-tx-power');
    clearError('iot-lb-sensitivity');

    try {
        const freqHz = freqMHz * 1e6;
        const eirpDbm = txDbm + txGainDbi - feederLoss;
        const mclDb  = eirpDbm - sensDbm + rxGainDbi; // Maximum Coupling Loss
        const linkMarginDb = mclDb - marginDb;

        // Max range (0-margin and user-margin FSPL only)
        const maxRangeFsplM   = iotMaxRange(txDbm, txGainDbi - feederLoss, sensDbm, rxGainDbi, freqHz, 0);
        const maxRangeMarginM = iotMaxRange(txDbm, txGainDbi - feederLoss, sensDbm, rxGainDbi, freqHz, marginDb);

        // Typical additional losses for indoor/urban
        const indoorPenetrationDb = freqMHz > 2000 ? 20 : freqMHz > 800 ? 15 : 12;
        const urbanShadowingDb    = freqMHz > 2000 ? 30 : freqMHz > 800 ? 25 : 20;

        const indoorRangeM  = iotMaxRange(txDbm, txGainDbi - feederLoss, sensDbm, rxGainDbi, freqHz, marginDb + indoorPenetrationDb);
        const outdoorRangeM = iotMaxRange(txDbm, txGainDbi - feederLoss, sensDbm, rxGainDbi, freqHz, marginDb);

        const fsplAt100m  = iotFSPL(100, freqHz);
        const fsplAt1km   = iotFSPL(1000, freqHz);
        const fsplAt10km  = iotFSPL(10000, freqHz);

        let qualityClass, qualityLabel;
        if (mclDb >= 164) {
            qualityClass = 'quality-excellent'; qualityLabel = 'Excellent (NB-IoT class)';
        } else if (mclDb >= 155) {
            qualityClass = 'quality-good';      qualityLabel = 'Very Good (LTE-M class)';
        } else if (mclDb >= 140) {
            qualityClass = 'quality-fair';      qualityLabel = 'Good (LoRa / Sigfox class)';
        } else {
            qualityClass = 'quality-poor';      qualityLabel = 'Moderate (BLE / Wi-Fi class)';
        }

        const html = `
            <h4>IoT Link Budget Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Budget Summary:</strong>
                    <ul>
                        <li>EIRP = ${formatNumber(eirpDbm, 1)} dBm</li>
                        <li>Rx Sensitivity = ${formatNumber(sensDbm, 1)} dBm</li>
                        <li>MCL = ${formatNumber(mclDb, 1)} dB</li>
                        <li>Link margin = ${formatNumber(linkMarginDb, 1)} dB</li>
                        <li class="${qualityClass}">${qualityLabel}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Max Range:</strong>
                    <ul>
                        <li>Theoretical (FSPL only) = ${formatNumber(maxRangeFsplM / 1000, 2)} km</li>
                        <li>Outdoor (${marginDb} dB margin) = ${formatNumber(outdoorRangeM / 1000, 2)} km</li>
                        <li>Indoor (+${indoorPenetrationDb} dB penetration) = ${formatNumber(indoorRangeM / 1000, 2)} km</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>FSPL Reference:</strong>
                    <ul>
                        <li>FSPL @ 100 m = ${formatNumber(fsplAt100m, 1)} dB</li>
                        <li>FSPL @ 1 km = ${formatNumber(fsplAt1km, 1)} dB</li>
                        <li>FSPL @ 10 km = ${formatNumber(fsplAt10km, 1)} dB</li>
                        <li>Frequency = ${formatNumber(freqMHz, 1)} MHz</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>System:</strong>
                    <ul>
                        <li>TX power = ${formatNumber(txDbm, 1)} dBm</li>
                        <li>TX gain = ${formatNumber(txGainDbi, 1)} dBi</li>
                        <li>Feeder loss = ${formatNumber(feederLoss, 1)} dB</li>
                        <li>RX gain = ${formatNumber(rxGainDbi, 1)} dBi</li>
                        <li>Fade margin = ${formatNumber(marginDb, 1)} dB</li>
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>MCL = EIRP − Rx Sensitivity + Rx Antenna Gain</strong></p>
                <ul>
                    <li>Indoor penetration loss: ~${indoorPenetrationDb} dB at ${freqMHz} MHz</li>
                    <li>Typical fade margin: 10 dB (LOS), 20–30 dB (NLOS urban)</li>
                    <li>MCL benchmarks: NB-IoT ~164 dB, LTE-M ~156 dB, LoRa ~155 dB, Sigfox ~149 dB</li>
                    <li>BLE/Zigbee ~100–110 dB; good for short-range applications</li>
                </ul>
            </div>`;

        document.getElementById('iot-lb-results').innerHTML = html;

    } catch (error) {
        document.getElementById('iot-lb-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. IoT Battery Life Estimator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * IoT device battery life estimation based on duty cycle and current consumption.
 */
function calculateIoTBatteryLife() {
    const capacityMah   = parseFloat(document.getElementById('iot-batt-capacity').value);
    const txCurrentMa   = parseFloat(document.getElementById('iot-batt-tx-current').value);
    const txDurationMs  = parseFloat(document.getElementById('iot-batt-tx-duration').value);
    const rxCurrentMa   = parseFloat(document.getElementById('iot-batt-rx-current').value);
    const rxDurationMs  = parseFloat(document.getElementById('iot-batt-rx-duration').value);
    const sleepCurrentUa= parseFloat(document.getElementById('iot-batt-sleep-current').value);
    const intervalSec   = parseFloat(document.getElementById('iot-batt-interval').value);
    const selfDischarge = parseFloat(document.getElementById('iot-batt-self-discharge').value) || 2;

    if (!validateInput(capacityMah)) {
        showError('iot-batt-capacity', 'Please enter a valid battery capacity');
        return;
    }
    if (!validateInput(txCurrentMa)) {
        showError('iot-batt-tx-current', 'Please enter a valid TX current');
        return;
    }
    if (!validateInput(txDurationMs, 0)) {
        showError('iot-batt-tx-duration', 'Please enter a valid TX duration');
        return;
    }
    if (!validateInput(intervalSec)) {
        showError('iot-batt-interval', 'Please enter a valid message interval');
        return;
    }
    clearError('iot-batt-capacity');
    clearError('iot-batt-tx-current');
    clearError('iot-batt-tx-duration');
    clearError('iot-batt-interval');

    try {
        const txCurrentMa2  = txCurrentMa;
        const rxCurrentMa2  = isNaN(rxCurrentMa)    ? 0 : rxCurrentMa;
        const rxDurationMs2 = isNaN(rxDurationMs)   ? 0 : rxDurationMs;
        const sleepUa       = isNaN(sleepCurrentUa) ? 0 : sleepCurrentUa;
        const sleepMa       = sleepUa / 1000;

        const intervalMs      = intervalSec * 1000;
        const sleepDurationMs = intervalMs - txDurationMs - rxDurationMs2;

        if (sleepDurationMs < 0) {
            showError('iot-batt-interval',
                'Interval must be longer than TX + RX duration combined');
            return;
        }

        // Average current over one interval (in mA)
        const avgCurrentMa = (
            txCurrentMa2  * txDurationMs  +
            rxCurrentMa2  * rxDurationMs2 +
            sleepMa       * sleepDurationMs
        ) / intervalMs;

        // Battery life in hours (usable capacity = nominal × 0.85 for Li batteries)
        const usableCapacityMah = capacityMah * 0.85;
        const lifetimeHours     = usableCapacityMah / avgCurrentMa;
        const lifetimeDays      = lifetimeHours / 24;
        const lifetimeYears     = lifetimeDays / 365.25;

        // Self-discharge correction (% / year → reduces effective capacity)
        const selfDischargeCorrection = 1 - (selfDischarge / 100) * lifetimeYears;
        const adjustedLifetimeYears   = lifetimeYears * Math.max(selfDischargeCorrection, 0);

        // TX duty cycle
        const txDutyCyclePercent = (txDurationMs / intervalMs) * 100;

        // Energy per message (µWh) — for reference (assuming 3V supply)
        // mA × ms × V → mW·ms = mJ/1000 → µWh: (mA × ms × V) / 3600
        const energyPerMsgUwh = (txCurrentMa2 * txDurationMs * 3) / 3600;

        // Power consumption breakdown
        const txPowerFrac    = (txCurrentMa2 * txDurationMs)  / (avgCurrentMa * intervalMs);
        const rxPowerFrac    = (rxCurrentMa2 * rxDurationMs2) / (avgCurrentMa * intervalMs);
        const sleepPowerFrac = (sleepMa * sleepDurationMs)    / (avgCurrentMa * intervalMs);

        // Color-coded lifetime assessment
        let lifetimeClass, lifetimeLabel;
        if (adjustedLifetimeYears >= 10) {
            lifetimeClass = 'quality-excellent'; lifetimeLabel = 'Excellent (>10 years)';
        } else if (adjustedLifetimeYears >= 5) {
            lifetimeClass = 'quality-good';      lifetimeLabel = 'Good (5–10 years)';
        } else if (adjustedLifetimeYears >= 1) {
            lifetimeClass = 'quality-fair';      lifetimeLabel = 'Fair (1–5 years)';
        } else {
            lifetimeClass = 'quality-poor';      lifetimeLabel = 'Poor (<1 year)';
        }

        const html = `
            <h4>IoT Battery Life Results</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Battery Lifetime:</strong>
                    <ul>
                        <li><strong>${formatNumber(lifetimeDays, 0)} days</strong></li>
                        <li>${formatNumber(lifetimeYears, 2)} years (no self-discharge)</li>
                        <li>${formatNumber(adjustedLifetimeYears, 2)} years (with ${formatNumber(selfDischarge, 1)}%/yr self-discharge)</li>
                        <li class="${lifetimeClass}">${lifetimeLabel}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Current Breakdown:</strong>
                    <ul>
                        <li>Average current = ${formatNumber(avgCurrentMa * 1000, 1)} µA</li>
                        <li>TX share = ${formatNumber(txPowerFrac * 100, 1)}%</li>
                        <li>RX share = ${formatNumber(rxPowerFrac * 100, 1)}%</li>
                        <li>Sleep share = ${formatNumber(sleepPowerFrac * 100, 1)}%</li>
                        <li>TX duty cycle = ${formatNumber(txDutyCyclePercent, 4)}%</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Per-Message:</strong>
                    <ul>
                        <li>Messages/day = ${formatNumber(86400 / intervalSec, 0)}</li>
                        <li>TX duration = ${formatNumber(txDurationMs, 1)} ms</li>
                        <li>Energy/msg ≈ ${formatNumber(energyPerMsgUwh, 3)} µWh @ 3 V</li>
                        <li>Charge/msg = ${formatNumber(txCurrentMa2 * txDurationMs / 3600000, 4)} µAh</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Capacity:</strong>
                    <ul>
                        <li>Nominal = ${formatNumber(capacityMah, 0)} mAh</li>
                        <li>Usable (85%) = ${formatNumber(usableCapacityMah, 0)} mAh</li>
                        <li>Self-discharge = ${formatNumber(selfDischarge, 1)}% / year</li>
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>Optimization Tips:</strong></p>
                <ul>
                    <li>Sleep current dominates for long-lived devices — minimize µA leakage</li>
                    <li>LoRa SF12 ToA ~2.5 s; at 15 min interval TX duty ≈ 0.003% — sleep current matters far more</li>
                    <li>Reducing send frequency from 1/min to 1/hr multiplies battery life up to 60× for TX-dominated designs</li>
                    <li>Li-SOCl₂ (bobbin): very low self-discharge (~1%/yr), ideal for 10+ year IoT</li>
                    <li>AA Li: ~3000 mAh; CR2032: ~220 mAh; AAA alkaline: ~1200 mAh</li>
                </ul>
            </div>`;

        document.getElementById('iot-battery-results').innerHTML = html;

    } catch (error) {
        document.getElementById('iot-battery-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. IoT Technology Comparison Table
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a comparison table for all major IoT technologies.
 * Optionally accepts a user-specified fade margin.
 */
function renderIoTComparison() {
    const marginDb = parseFloat(document.getElementById('iot-cmp-margin').value) || 10;

    try {
        const rows = IOT_TECH_DATA.map(tech => {
            const freqHz  = tech.freqMHz * 1e6;
            const mclDb   = tech.txDbm + tech.antGainTxDbi - tech.sensitivityDbm + tech.antGainRxDbi;
            const rngM    = iotMaxRange(tech.txDbm, tech.antGainTxDbi, tech.sensitivityDbm, tech.antGainRxDbi, freqHz, marginDb);
            const rngKm   = rngM / 1000;

            let mclClass;
            if (mclDb >= 160)      mclClass = 'quality-excellent';
            else if (mclDb >= 150) mclClass = 'quality-good';
            else if (mclDb >= 130) mclClass = 'quality-fair';
            else                   mclClass = 'quality-poor';

            const dataStr = tech.dataRateKbps >= 1000
                ? `${formatNumber(tech.dataRateKbps / 1000, 1)} Mbps`
                : tech.dataRateKbps >= 1
                    ? `${formatNumber(tech.dataRateKbps, 2)} kbps`
                    : `${formatNumber(tech.dataRateKbps * 1000, 0)} bps`;

            return `<tr>
                <td><strong>${tech.name}</strong></td>
                <td>${formatNumber(tech.freqMHz, 0)} MHz</td>
                <td>${formatNumber(tech.txDbm, 0)} dBm</td>
                <td>${formatNumber(tech.sensitivityDbm, 0)} dBm</td>
                <td class="${mclClass}">${formatNumber(mclDb, 1)} dB</td>
                <td>${formatNumber(rngKm, 2)} km</td>
                <td>${tech.rangeOutdoor}</td>
                <td>${dataStr}</td>
                <td>${tech.powerClass}</td>
                <td style="font-size:0.8em">${tech.notes}</td>
            </tr>`;
        }).join('');

        const html = `
            <h4>IoT Technology Comparison (${marginDb} dB fade margin)</h4>
            <div class="iot-table-scroll">
                <table class="iot-comparison-table iot-comparison-wide">
                    <thead>
                        <tr>
                            <th>Technology</th>
                            <th>Freq</th>
                            <th>TX Power</th>
                            <th>Sensitivity</th>
                            <th>MCL</th>
                            <th>Calc Range</th>
                            <th>Typical Outdoor</th>
                            <th>Data Rate</th>
                            <th>Power</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="info-section">
                <ul>
                    <li><strong>MCL (Maximum Coupling Loss)</strong> = EIRP − Sensitivity; higher is better for range</li>
                    <li>Calculated range uses FSPL model only with ${marginDb} dB fade margin — real range varies greatly with terrain and environment</li>
                    <li>Sub-GHz (LoRa, Sigfox, NB-IoT, Z-Wave) penetrates walls and travels further than 2.4 GHz</li>
                    <li>Cellular (NB-IoT, LTE-M) uses existing network infrastructure — no gateway deployment needed</li>
                    <li>LoRa/LoRaWAN requires private or public (TTN/Helium) gateways</li>
                </ul>
            </div>`;

        document.getElementById('iot-comparison-results').innerHTML = html;

    } catch (error) {
        document.getElementById('iot-comparison-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BLE (Bluetooth Low Energy) Calculator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BLE PHY parameters per Bluetooth Core Specification 5.x
 * Sensitivity values are typical for a good-quality radio (e.g. nRF52840).
 */
const BLE_PHY = {
    '1M': {
        label:          'BLE 1M PHY (1 Mbps)',
        symbolRateMbps: 1,
        datRateMbps:    1,
        sensitivityDbm: -96,
        preambleBytes:  1,
        version:        'BLE 4.0+',
        /** ToA in µs: (preamble + AA=4 + PDU_header=2 + payload + CRC=3) × 8 µs */
        toaUs: (payloadBytes) => (1 + 4 + 2 + payloadBytes + 3) * 8,
    },
    '2M': {
        label:          'BLE 2M PHY (2 Mbps)',
        symbolRateMbps: 2,
        datRateMbps:    2,
        sensitivityDbm: -92,
        preambleBytes:  2,
        version:        'BLE 5.0+',
        /** ToA in µs: (preamble=2 + AA=4 + PDU_header=2 + payload + CRC=3) × 4 µs */
        toaUs: (payloadBytes) => (2 + 4 + 2 + payloadBytes + 3) * 4,
    },
    'coded_s2': {
        label:          'BLE Coded S=2 (500 kbps)',
        symbolRateMbps: 0.5,
        datRateMbps:    0.5,
        sensitivityDbm: -100,
        preambleBytes:  10,
        version:        'BLE 5.0+',
        /**
         * Coded S=2 ToA per BT spec:
         *   FEC block 1: preamble(80µs) + AA(32µs) + CI(2µs) + TERM1(3µs) = 117 µs
         *   FEC block 2: (PDU_header=2 + payload + CRC=3) × 8 bits × 2 µs/bit
         *              + TERM2: 3 bits × 2 µs = 6 µs
         */
        toaUs: (payloadBytes) => 117 + (2 + payloadBytes + 3) * 16 + 6,
    },
    'coded_s8': {
        label:          'BLE Coded S=8 (125 kbps)',
        symbolRateMbps: 0.125,
        datRateMbps:    0.125,
        sensitivityDbm: -103,
        preambleBytes:  10,
        version:        'BLE 5.0+',
        /**
         * Coded S=8 ToA per BT spec:
         *   FEC block 1: same 117 µs
         *   FEC block 2: (PDU_header=2 + payload + CRC=3) × 8 bits × 8 µs/bit
         *              + TERM2: 3 bits × 8 µs = 24 µs
         */
        toaUs: (payloadBytes) => 117 + (2 + payloadBytes + 3) * 64 + 24,
    },
};

/** BLE advertising channel IFS (inter-frame spacing) = 150 µs */
const BLE_IFS_US = 150;
/** Number of primary advertising channels */
const BLE_ADV_CHANNELS = 3;

/**
 * BLE comprehensive calculator: Time on Air, link budget, power, and PHY comparison.
 */
function calculateBLE() {
    const phyKey       = document.getElementById('ble-phy').value;
    const txDbm        = parseFloat(document.getElementById('ble-tx-power').value);
    const payloadBytes = parseInt(document.getElementById('ble-payload').value, 10);
    const mode         = document.getElementById('ble-mode').value;      // 'advertising' | 'connection'
    const intervalMs   = parseFloat(document.getElementById('ble-interval').value);
    const txCurrentMa  = parseFloat(document.getElementById('ble-tx-current').value);
    const rxCurrentMa  = parseFloat(document.getElementById('ble-rx-current').value);
    const sleepUa      = parseFloat(document.getElementById('ble-sleep-current').value) || 2;
    const battMah      = parseFloat(document.getElementById('ble-battery').value);
    const freqMHz      = 2440; // BLE center of 2.4 GHz band (advertising channels avg)
    const rxGainDbi    = 0;

    const phy = BLE_PHY[phyKey];
    if (!phy) {
        showError('ble-phy', 'Please select a PHY mode');
        return;
    }
    if (isNaN(txDbm)) {
        showError('ble-tx-power', 'Please enter a valid TX power');
        return;
    }
    if (!validateInput(payloadBytes, 0) || payloadBytes > 255) {
        showError('ble-payload', 'Payload must be 0–255 bytes');
        return;
    }
    if (!validateInput(intervalMs)) {
        showError('ble-interval', 'Please enter a valid interval');
        return;
    }
    if (!validateInput(txCurrentMa)) {
        showError('ble-tx-current', 'Please enter a valid TX current');
        return;
    }
    clearError('ble-phy');
    clearError('ble-tx-power');
    clearError('ble-payload');
    clearError('ble-interval');
    clearError('ble-tx-current');

    try {
        const freqHz         = freqMHz * 1e6;
        const sleepMa        = sleepUa / 1000;
        const intervalUs     = intervalMs * 1000;
        // Normalize optional fields that are not required inputs
        const rxCurrentMaNorm = isNaN(rxCurrentMa) ? 0 : rxCurrentMa;

        // ── Time on Air ──────────────────────────────────────────────────────
        const toaPerPktUs = phy.toaUs(payloadBytes);

        let activeTxUs, activeRxUs, txEventsPerInterval;
        if (mode === 'advertising') {
            // 3 advertising channels; IFS between channels
            activeTxUs = BLE_ADV_CHANNELS * toaPerPktUs + (BLE_ADV_CHANNELS - 1) * BLE_IFS_US;
            activeRxUs = 0; // no RX for non-connectable advertising
            txEventsPerInterval = BLE_ADV_CHANNELS;
        } else {
            // Connection mode: one TX + one RX per connection event
            activeTxUs = toaPerPktUs;
            activeRxUs = toaPerPktUs + BLE_IFS_US; // peer responds with its own packet
            txEventsPerInterval = 1;
        }

        const sleepUs = intervalUs - activeTxUs - activeRxUs;

        // If active time exceeds the interval, the schedule is impossible.
        // This would otherwise clamp to zero sleep and produce >100% duty cycle
        // and optimistic battery life estimates.
        if (sleepUs < 0) {
            throw new Error(
                'Selected BLE interval is too short for the chosen PHY, payload size, and mode. ' +
                'Increase the connection/advertising interval or reduce the payload size / use a faster PHY.'
            );
        }

        // ── Average current ──────────────────────────────────────────────────
        const avgCurrentMa = (
            txCurrentMa       * activeTxUs +
            rxCurrentMaNorm   * activeRxUs +
            sleepMa           * sleepUs
        ) / intervalUs;

        const txDutyPct = (activeTxUs / intervalUs) * 100;

        // ── Battery life ─────────────────────────────────────────────────────
        let lifetimeDays = NaN, lifetimeYears = NaN;
        if (!isNaN(battMah) && battMah > 0) {
            const usableMah = battMah * 0.85;
            lifetimeDays  = usableMah / avgCurrentMa / 24;
            lifetimeYears = lifetimeDays / 365.25;
        }

        // ── Link budget & range ───────────────────────────────────────────────
        const eirpDbm    = txDbm + rxGainDbi; // 0 dBi antenna
        const mclDb      = eirpDbm - phy.sensitivityDbm + rxGainDbi;
        const maxRangeM  = iotMaxRange(txDbm, 0, phy.sensitivityDbm, 0, freqHz, 0);
        const indoorRangeM = iotMaxRange(txDbm, 0, phy.sensitivityDbm, 0, freqHz, 25); // 25 dB indoor margin

        // ── Effective throughput (payload bits / total packet air time) ───────
        const effectiveThroughputKbps = (payloadBytes > 0)
            ? (payloadBytes * 8 / toaPerPktUs * 1000) // kbps
            : 0;

        // ── PHY comparison table ──────────────────────────────────────────────
        const compRows = Object.entries(BLE_PHY).map(([key, p]) => {
            const toa   = p.toaUs(payloadBytes);
            const adv   = BLE_ADV_CHANNELS * toa + (BLE_ADV_CHANNELS - 1) * BLE_IFS_US;
            const rng   = iotMaxRange(txDbm, 0, p.sensitivityDbm, 0, freqHz, 0);
            const rngIn = iotMaxRange(txDbm, 0, p.sensitivityDbm, 0, freqHz, 25);
            const tput  = payloadBytes > 0 ? formatNumber(payloadBytes * 8 / toa * 1000, 1) : '—';
            const highlight = key === phyKey ? 'class="highlight-row"' : '';
            return `<tr ${highlight}>
                <td>${p.label}</td>
                <td>${p.version}</td>
                <td>${formatNumber(p.sensitivityDbm, 0)} dBm</td>
                <td>${formatNumber(toa, 0)} µs</td>
                <td>${formatNumber(adv / 1000, 3)} ms</td>
                <td>${formatNumber(rng, 1)} m</td>
                <td>${formatNumber(rngIn, 1)} m</td>
                <td>${tput} kbps</td>
            </tr>`;
        }).join('');

        // ── Battery life rating ───────────────────────────────────────────────
        let lifeClass, lifeLabel;
        if (isNaN(lifetimeYears)) {
            lifeClass = ''; lifeLabel = '—';
        } else if (lifetimeYears >= 5) {
            lifeClass = 'quality-excellent'; lifeLabel = `${formatNumber(lifetimeDays, 0)} days (Excellent)`;
        } else if (lifetimeYears >= 1) {
            lifeClass = 'quality-good';      lifeLabel = `${formatNumber(lifetimeDays, 0)} days (Good)`;
        } else {
            lifeClass = 'quality-poor';      lifeLabel = `${formatNumber(lifetimeDays, 0)} days (Poor)`;
        }

        const intervalLabel = mode === 'advertising'
            ? `Advertising interval = ${intervalMs} ms`
            : `Connection interval = ${intervalMs} ms`;

        const html = `
            <h4>BLE Calculator Results — ${phy.label}</h4>
            <div class="result-grid">
                <div class="result-item">
                    <strong>Time on Air (${payloadBytes}B payload):</strong>
                    <ul>
                        <li>Per packet = ${formatNumber(toaPerPktUs, 1)} µs</li>
                        ${mode === 'advertising'
                            ? `<li>3-channel adv event = ${formatNumber(activeTxUs / 1000, 3)} ms</li>`
                            : `<li>TX slot (conn) = ${formatNumber(activeTxUs, 1)} µs</li>
                               <li>RX window = ${formatNumber(activeRxUs, 1)} µs</li>`}
                        <li>TX duty cycle = ${formatNumber(txDutyPct, 4)}%</li>
                        <li>Effective throughput = ${payloadBytes > 0 ? formatNumber(effectiveThroughputKbps, 2) + ' kbps' : '—'}</li>
                        <li>${intervalLabel}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Link Budget:</strong>
                    <ul>
                        <li>TX power = ${formatNumber(txDbm, 1)} dBm</li>
                        <li>Sensitivity = ${formatNumber(phy.sensitivityDbm, 0)} dBm</li>
                        <li>MCL = ${formatNumber(mclDb, 1)} dB</li>
                        <li>Max range (FSPL) = ${formatNumber(maxRangeM, 1)} m</li>
                        <li>Indoor range (25 dB margin) = ${formatNumber(indoorRangeM, 1)} m</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Power Consumption:</strong>
                    <ul>
                        <li>TX current = ${formatNumber(txCurrentMa, 1)} mA</li>
                        <li>Sleep current = ${formatNumber(sleepUa, 1)} µA</li>
                        <li>Average = ${formatNumber(avgCurrentMa * 1000, 2)} µA</li>
                        <li>${intervalLabel}</li>
                    </ul>
                </div>
                <div class="result-item">
                    <strong>Battery Life:</strong>
                    <ul>
                        <li class="${lifeClass}">${lifeLabel}</li>
                        ${!isNaN(battMah) && battMah > 0
                            ? `<li>Battery = ${formatNumber(battMah, 0)} mAh (85% usable)</li>
                               <li>${formatNumber(lifetimeYears, 2)} years</li>`
                            : '<li>Enter battery capacity above</li>'}
                    </ul>
                </div>
            </div>
            <div class="info-section">
                <p><strong>PHY Comparison (${payloadBytes}B payload, ${formatNumber(txDbm, 0)} dBm TX):</strong></p>
                <div class="iot-table-scroll">
                    <table class="iot-comparison-table">
                        <thead>
                            <tr>
                                <th>PHY</th>
                                <th>BT Ver.</th>
                                <th>Sensitivity</th>
                                <th>Pkt ToA</th>
                                <th>Adv Event</th>
                                <th>Max Range (FSPL)</th>
                                <th>Indoor Range</th>
                                <th>Eff. Throughput</th>
                            </tr>
                        </thead>
                        <tbody>${compRows}</tbody>
                    </table>
                </div>
                <ul>
                    <li><strong>1M PHY</strong>: universal support from BLE 4.0; best compatibility</li>
                    <li><strong>2M PHY</strong>: 2× data rate, shorter ToA → lower average current for high-throughput use cases; slightly worse sensitivity than 1M</li>
                    <li><strong>Coded S=2</strong>: 2× coding gain → ~4× range vs 1M; 7.5× longer ToA → higher average current for same interval</li>
                    <li><strong>Coded S=8</strong>: 4× coding gain → ~16× range vs 1M; 30× longer ToA; ideal for long-range, low-duty-cycle sensors</li>
                    <li>Indoor range uses 25 dB fade margin (walls, multipath); reduce to 10–15 dB for LOS environments</li>
                    <li>Advertising on channels 37, 38, 39; BLE mesh may use all 40 channels</li>
                </ul>
            </div>`;

        document.getElementById('ble-results').innerHTML = html;

    } catch (error) {
        document.getElementById('ble-results').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// Auto-render comparison on page load
document.addEventListener('DOMContentLoaded', () => {
    renderIoTComparison();
});
