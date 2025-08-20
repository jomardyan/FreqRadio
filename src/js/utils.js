// Utility functions for RF calculations and unit conversions

/**
 * Convert frequency to wavelength
 * @param {number} frequency - Frequency value
 * @param {string} freqUnit - Frequency unit (Hz, kHz, MHz, GHz)
 * @param {number} velocityFactor - Velocity factor (default 1.0 for free space)
 * @returns {number} Wavelength in meters
 */
function frequencyToWavelength(frequency, freqUnit, velocityFactor = 1.0) {
    const freqHz = frequency * CONSTANTS.FREQ_UNITS[freqUnit];
    return (CONSTANTS.SPEED_OF_LIGHT * velocityFactor) / freqHz;
}

/**
 * Convert wavelength to frequency
 * @param {number} wavelength - Wavelength value
 * @param {string} lengthUnit - Length unit
 * @param {number} velocityFactor - Velocity factor (default 1.0 for free space)
 * @returns {number} Frequency in Hz
 */
function wavelengthToFrequency(wavelength, lengthUnit, velocityFactor = 1.0) {
    const wavelengthM = wavelength * CONSTANTS.LENGTH_UNITS[lengthUnit];
    return (CONSTANTS.SPEED_OF_LIGHT * velocityFactor) / wavelengthM;
}

/**
 * Convert between different units
 * @param {number} value - Value to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @param {Object} unitMap - Unit conversion map
 * @returns {number} Converted value
 */
function convertUnits(value, fromUnit, toUnit, unitMap) {
    if (fromUnit === toUnit) return value;
    
    const fromFactor = unitMap[fromUnit];
    const toFactor = unitMap[toUnit];
    
    if (!fromFactor || !toFactor) {
        throw new Error(`Unknown unit: ${fromUnit} or ${toUnit}`);
    }
    
    return value * fromFactor / toFactor;
}

/**
 * Convert power between different units
 * @param {number} value - Power value
 * @param {string} fromUnit - Source unit (W, mW, kW, dBm, dBW)
 * @param {string} toUnit - Target unit
 * @returns {number} Converted power
 */
function convertPower(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    
    // First convert to watts
    let watts;
    switch (fromUnit) {
        case 'W': watts = value; break;
        case 'mW': watts = value / 1000; break;
        case 'kW': watts = value * 1000; break;
        case 'dBm': watts = MATH.DBM_TO_WATTS(value); break;
        case 'dBW': watts = MATH.DBW_TO_WATTS(value); break;
        default: throw new Error(`Unknown power unit: ${fromUnit}`);
    }
    
    // Then convert from watts to target unit
    switch (toUnit) {
        case 'W': return watts;
        case 'mW': return watts * 1000;
        case 'kW': return watts / 1000;
        case 'dBm': return MATH.WATTS_TO_DBM(watts);
        case 'dBW': return MATH.WATTS_TO_DBW(watts);
        default: throw new Error(`Unknown power unit: ${toUnit}`);
    }
}

/**
 * Format a number with appropriate precision
 * @param {number} value - Value to format
 * @param {number} precision - Number of decimal places
 * @param {boolean} scientific - Use scientific notation for very small/large numbers
 * @returns {string} Formatted number
 */
function formatNumber(value, precision = 3, scientific = false) {
    if (isNaN(value) || !isFinite(value)) return 'Invalid';
    
    if (scientific && (Math.abs(value) > 1e6 || Math.abs(value) < 1e-3)) {
        return value.toExponential(precision);
    }
    
    return parseFloat(value.toFixed(precision)).toString();
}

/**
 * Get the appropriate unit prefix for a value
 * @param {number} value - Value to analyze
 * @param {Object} unitMap - Unit conversion map
 * @param {string} baseUnit - Base unit name
 * @returns {Object} {value, unit} with appropriate prefix
 */
function getAppropriateUnit(value, unitMap, baseUnit) {
    const abs = Math.abs(value);
    
    // Find the best unit that gives a value between 0.1 and 1000
    const sortedUnits = Object.entries(unitMap)
        .sort(([,a], [,b]) => b - a);
    
    for (const [unit, factor] of sortedUnits) {
        const convertedValue = value / factor;
        if (Math.abs(convertedValue) >= 0.1 && Math.abs(convertedValue) < 1000) {
            return { value: convertedValue, unit };
        }
    }
    
    return { value, unit: baseUnit };
}

/**
 * Calculate reactance of an inductor
 * @param {number} frequency - Frequency in Hz
 * @param {number} inductance - Inductance in H
 * @returns {number} Inductive reactance in ohms
 */
function inductiveReactance(frequency, inductance) {
    return CONSTANTS.TWO_PI * frequency * inductance;
}

/**
 * Calculate reactance of a capacitor
 * @param {number} frequency - Frequency in Hz
 * @param {number} capacitance - Capacitance in F
 * @returns {number} Capacitive reactance in ohms (positive value)
 */
function capacitiveReactance(frequency, capacitance) {
    return 1 / (CONSTANTS.TWO_PI * frequency * capacitance);
}

/**
 * Calculate LC resonant frequency
 * @param {number} inductance - Inductance in H
 * @param {number} capacitance - Capacitance in F
 * @returns {number} Resonant frequency in Hz
 */
function lcResonantFrequency(inductance, capacitance) {
    return 1 / (CONSTANTS.TWO_PI * Math.sqrt(inductance * capacitance));
}

/**
 * Calculate Q factor for series RLC circuit
 * @param {number} resistance - Resistance in ohms
 * @param {number} inductance - Inductance in H
 * @param {number} capacitance - Capacitance in F
 * @returns {number} Q factor
 */
function seriesQFactor(resistance, inductance, capacitance) {
    const resonantFreq = lcResonantFrequency(inductance, capacitance);
    const xl = inductiveReactance(resonantFreq, inductance);
    return xl / resistance;
}

/**
 * Calculate VSWR from reflection coefficient
 * @param {number} gamma - Reflection coefficient magnitude
 * @returns {number} VSWR
 */
function gammaToVSWR(gamma) {
    if (gamma >= 1) return Infinity;
    return (1 + gamma) / (1 - gamma);
}

/**
 * Calculate reflection coefficient from VSWR
 * @param {number} vswr - VSWR
 * @returns {number} Reflection coefficient magnitude
 */
function vswrToGamma(vswr) {
    if (vswr < 1) return 0;
    if (!isFinite(vswr)) return 1;
    return (vswr - 1) / (vswr + 1);
}

/**
 * Calculate return loss from reflection coefficient
 * @param {number} gamma - Reflection coefficient magnitude
 * @returns {number} Return loss in dB
 */
function gammaToReturnLoss(gamma) {
    if (gamma === 0) return Infinity;
    return -20 * Math.log10(gamma);
}

/**
 * Calculate reflection coefficient from return loss
 * @param {number} returnLoss - Return loss in dB
 * @returns {number} Reflection coefficient magnitude
 */
function returnLossToGamma(returnLoss) {
    if (!isFinite(returnLoss)) return 0;
    return Math.pow(10, -returnLoss / 20);
}

/**
 * Calculate mismatch loss
 * @param {number} gamma - Reflection coefficient magnitude
 * @returns {number} Mismatch loss in dB
 */
function mismatchLoss(gamma) {
    const gammaSquared = gamma * gamma;
    return -10 * Math.log10(1 - gammaSquared);
}

/**
 * Calculate electrical length in degrees
 * @param {number} frequency - Frequency in Hz
 * @param {number} physicalLength - Physical length in meters
 * @param {number} velocityFactor - Velocity factor
 * @returns {number} Electrical length in degrees
 */
function electricalLength(frequency, physicalLength, velocityFactor = 1.0) {
    const wavelength = frequencyToWavelength(frequency, 'Hz', velocityFactor);
    return (physicalLength / wavelength) * 360;
}

/**
 * Calculate free space path loss
 * @param {number} frequency - Frequency in Hz
 * @param {number} distance - Distance in meters
 * @returns {number} Path loss in dB
 */
function freeSpacePathLoss(frequency, distance) {
    const freqMHz = frequency / 1e6;
    const distanceKm = distance / 1000;
    return 32.44 + 20 * Math.log10(freqMHz) + 20 * Math.log10(distanceKm);
}

/**
 * Calculate Fresnel zone radius
 * @param {number} frequency - Frequency in Hz
 * @param {number} distance1 - Distance from transmitter to point (meters)
 * @param {number} distance2 - Distance from point to receiver (meters)
 * @param {number} zone - Fresnel zone number (default 1)
 * @returns {number} Fresnel zone radius in meters
 */
function fresnelZoneRadius(frequency, distance1, distance2, zone = 1) {
    const wavelength = frequencyToWavelength(frequency, 'Hz');
    const totalDistance = distance1 + distance2;
    return Math.sqrt((zone * wavelength * distance1 * distance2) / totalDistance);
}

/**
 * Validate input values
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} True if valid
 */
function validateInput(value, min = -Infinity, max = Infinity) {
    return !isNaN(value) && isFinite(value) && value >= min && value <= max && value > 0;
}

/**
 * Calculate antenna gain in different units
 * @param {number} gain - Gain value
 * @param {string} fromUnit - Source unit (dBi, dBd, linear)
 * @param {string} toUnit - Target unit
 * @returns {number} Converted gain
 */
function convertGain(gain, fromUnit, toUnit) {
    if (fromUnit === toUnit) return gain;
    
    // First convert to linear
    let linear;
    switch (fromUnit) {
        case 'linear': linear = gain; break;
        case 'dBi': linear = MATH.DB_TO_RATIO(gain); break;
        case 'dBd': linear = MATH.DB_TO_RATIO(gain + 2.14); break; // dBd to dBi conversion
        default: throw new Error(`Unknown gain unit: ${fromUnit}`);
    }
    
    // Then convert from linear to target unit
    switch (toUnit) {
        case 'linear': return linear;
        case 'dBi': return MATH.RATIO_TO_DB(linear);
        case 'dBd': return MATH.RATIO_TO_DB(linear) - 2.14;
        default: throw new Error(`Unknown gain unit: ${toUnit}`);
    }
}

/**
 * Get frequency band name
 * @param {number} frequency - Frequency in Hz
 * @returns {string} Band name
 */
function getFrequencyBand(frequency) {
    const freqMHz = frequency / 1e6;
    
    for (const [band, range] of Object.entries(CONSTANTS.BANDS)) {
        if (freqMHz >= range.min && freqMHz < range.max) {
            return band;
        }
    }
    
    return 'Unknown';
}

/**
 * Find nearest amateur radio band
 * @param {number} frequency - Frequency in Hz
 * @returns {Object|null} Band info or null if not found
 */
function getNearestAmateurBand(frequency) {
    const freqMHz = frequency / 1e6;
    let closestBand = null;
    let minDifference = Infinity;
    
    for (const [band, info] of Object.entries(CONSTANTS.AMATEUR_BANDS)) {
        const difference = Math.abs(freqMHz - info.freq);
        if (difference < minDifference) {
            minDifference = difference;
            closestBand = { band, ...info, difference };
        }
    }
    
    return closestBand;
}

/**
 * Calculate complex impedance magnitude and phase
 * @param {number} real - Real part
 * @param {number} imaginary - Imaginary part
 * @returns {Object} {magnitude, phase, real, imaginary}
 */
function complexImpedance(real, imaginary) {
    const magnitude = Math.sqrt(real * real + imaginary * imaginary);
    const phase = Math.atan2(imaginary, real) * 180 / Math.PI;
    
    return {
        magnitude,
        phase,
        real,
        imaginary
    };
}

/**
 * Debounce function for input handling
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}