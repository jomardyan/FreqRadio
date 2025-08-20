// Physical constants
const CONSTANTS = {
    SPEED_OF_LIGHT: 299792458, // m/s
    PI: Math.PI,
    TWO_PI: 2 * Math.PI,
    
    // Common impedances
    FREE_SPACE_IMPEDANCE: 376.730313668, // ohms
    
    // Conversion factors
    FREQ_UNITS: {
        'Hz': 1,
        'kHz': 1e3,
        'MHz': 1e6,
        'GHz': 1e9
    },
    
    LENGTH_UNITS: {
        'm': 1,
        'cm': 0.01,
        'mm': 0.001,
        'ft': 0.3048,
        'inches': 0.0254,
        'km': 1000,
        'miles': 1609.34
    },
    
    INDUCTANCE_UNITS: {
        'H': 1,
        'mH': 1e-3,
        'uH': 1e-6,
        'nH': 1e-9
    },
    
    CAPACITANCE_UNITS: {
        'F': 1,
        'mF': 1e-3,
        'uF': 1e-6,
        'nF': 1e-9,
        'pF': 1e-12
    },
    
    RESISTANCE_UNITS: {
        'ohm': 1,
        'kohm': 1e3,
        'mohm': 1e6
    },
    
    POWER_UNITS: {
        'W': 1,
        'mW': 1e-3,
        'kW': 1e3,
        'dBm': 'logarithmic',
        'dBW': 'logarithmic'
    },
    
    // Common antenna parameters
    ANTENNA: {
        DIPOLE_FACTOR: 0.95, // Typical shortening factor for dipole
        MONOPOLE_FACTOR: 0.95,
        END_EFFECT_PERCENT: 5, // Default end effect percentage
        
        // Yagi-Uda typical ratios
        YAGI: {
            REFLECTOR_RATIO: 1.05, // Reflector length as ratio of driven element
            DIRECTOR_RATIO: 0.9,    // Director length as ratio of driven element
            TYPICAL_SPACING: 0.15,  // Typical spacing in wavelengths
            GAIN_PER_DIRECTOR: 1.2, // Approximate gain increase per director (dB)
            BASE_GAIN: 2.14        // Dipole gain in dBi
        }
    },
    
    // Default values for calculations
    DEFAULTS: {
        VELOCITY_FACTOR: 0.95,
        COAX_VF: 0.66,
        IMPEDANCE_50: 50,
        IMPEDANCE_75: 75,
        TEMPERATURE: 20, // Celsius
        SUBSTRATE_ER: 4.4, // FR4
        SUBSTRATE_THICKNESS: 1.6 // mm
    },
    
    // Band definitions (MHz)
    BANDS: {
        'LF': { min: 0.03, max: 0.3 },
        'MF': { min: 0.3, max: 3 },
        'HF': { min: 3, max: 30 },
        'VHF': { min: 30, max: 300 },
        'UHF': { min: 300, max: 3000 },
        'SHF': { min: 3000, max: 30000 },
        'EHF': { min: 30000, max: 300000 }
    },
    
    // Amateur radio bands (MHz)
    AMATEUR_BANDS: {
        '160m': { freq: 1.8, name: '160 meters' },
        '80m': { freq: 3.5, name: '80 meters' },
        '40m': { freq: 7, name: '40 meters' },
        '20m': { freq: 14, name: '20 meters' },
        '15m': { freq: 21, name: '15 meters' },
        '10m': { freq: 28, name: '10 meters' },
        '6m': { freq: 50, name: '6 meters' },
        '2m': { freq: 144, name: '2 meters' },
        '70cm': { freq: 440, name: '70 centimeters' },
        '23cm': { freq: 1296, name: '23 centimeters' }
    },
    
    // Common coax cable types
    COAX_TYPES: {
        'RG-58': { impedance: 50, vf: 0.66, loss_db_100m_1ghz: 195 },
        'RG-174': { impedance: 50, vf: 0.66, loss_db_100m_1ghz: 680 },
        'RG-213': { impedance: 50, vf: 0.66, loss_db_100m_1ghz: 67 },
        'LMR-195': { impedance: 50, vf: 0.83, loss_db_100m_1ghz: 78 },
        'LMR-240': { impedance: 50, vf: 0.84, loss_db_100m_1ghz: 54 },
        'LMR-400': { impedance: 50, vf: 0.85, loss_db_100m_1ghz: 22 },
        'LMR-600': { impedance: 50, vf: 0.87, loss_db_100m_1ghz: 13.8 },
        'RG-59': { impedance: 75, vf: 0.66, loss_db_100m_1ghz: 180 },
        'RG-6': { impedance: 75, vf: 0.82, loss_db_100m_1ghz: 50 }
    }
};

// Mathematical helper constants
const MATH = {
    // Commonly used mathematical constants
    SQRT_2: Math.sqrt(2),
    SQRT_3: Math.sqrt(3),
    LN_10: Math.log(10),
    LOG10_E: Math.log10(Math.E),
    
    // Antenna-specific mathematical constants
    DIPOLE_RESISTANCE: 73, // ohms
    MONOPOLE_RESISTANCE: 36.5, // ohms (half of dipole)
    
    // dB conversion helpers
    DB_TO_RATIO: (db) => Math.pow(10, db / 10),
    RATIO_TO_DB: (ratio) => 10 * Math.log10(ratio),
    DBM_TO_WATTS: (dbm) => Math.pow(10, (dbm - 30) / 10),
    WATTS_TO_DBM: (watts) => 10 * Math.log10(watts * 1000),
    DBW_TO_WATTS: (dbw) => Math.pow(10, dbw / 10),
    WATTS_TO_DBW: (watts) => 10 * Math.log10(watts)
};

// Export constants for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONSTANTS, MATH };
}