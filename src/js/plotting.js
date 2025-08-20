// Plotting and visualization functions

let currentChart = null;

/**
 * Create a frequency response plot
 * @param {string} canvasId - Canvas element ID
 * @param {Array} frequencies - Array of frequency values
 * @param {Array} responses - Array of response values
 * @param {Object} options - Chart options
 */
function createFrequencyPlot(canvasId, frequencies, responses, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas element ${canvasId} not found`);
        return null;
    }
    
    // Destroy existing chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }
    
    const defaultOptions = {
        type: 'line',
        data: {
            labels: frequencies.map(f => formatNumber(f / 1e6, 3)),
            datasets: [{
                label: options.label || 'Response',
                data: responses,
                borderColor: options.color || 'rgb(33, 150, 243)',
                backgroundColor: options.backgroundColor || 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                fill: options.fill || false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: options.xLabel || 'Frequency (MHz)'
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: options.yLabel || 'Amplitude'
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: options.title || 'Frequency Response',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    };
    
    currentChart = new Chart(ctx, defaultOptions);
    return currentChart;
}

/**
 * Plot VSWR vs frequency
 * @param {number} centerFreq - Center frequency in Hz
 * @param {number} l - Inductance in H
 * @param {number} c - Capacitance in F
 * @param {number} r - Resistance in Ohms
 */
function plotVSWRvsFrequency(centerFreq, l, c, r) {
    const frequencies = [];
    const vswrValues = [];
    const steps = 100;
    const freqRange = 0.5; // ±50% around center frequency
    
    for (let i = 0; i < steps; i++) {
        const freq = centerFreq * (1 - freqRange + (2 * freqRange * i) / (steps - 1));
        frequencies.push(freq);
        
        // Calculate impedance at this frequency
        const omega = 2 * Math.PI * freq;
        const xl = omega * l;
        const xc = 1 / (omega * c);
        const reactance = xl - xc;
        const impedance = Math.sqrt(r * r + reactance * reactance);
        
        // Calculate VSWR (assuming 50Ω system)
        const gamma = Math.abs((impedance - 50) / (impedance + 50));
        const vswr = gammaToVSWR(gamma);
        vswrValues.push(vswr);
    }
    
    return createFrequencyPlot('chart-canvas', frequencies, vswrValues, {
        label: 'VSWR',
        yLabel: 'VSWR',
        title: 'VSWR vs Frequency',
        color: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)'
    });
}

/**
 * Plot antenna radiation pattern (simplified)
 * @param {string} antennaType - Type of antenna
 * @param {Object} parameters - Antenna parameters
 */
function plotRadiationPattern(antennaType, parameters = {}) {
    const angles = [];
    const pattern = [];
    
    for (let theta = 0; theta <= 360; theta += 2) {
        angles.push(theta);
        let gain = 0;
        
        switch (antennaType) {
            case 'dipole':
                // Simplified dipole pattern: sin²(θ)
                const thetaRad = theta * Math.PI / 180;
                gain = Math.pow(Math.sin(thetaRad), 2);
                break;
                
            case 'monopole':
                // Monopole pattern (half of dipole)
                const thetaRadMono = theta * Math.PI / 180;
                gain = theta <= 180 ? Math.pow(Math.sin(thetaRadMono), 2) : 0;
                break;
                
            case 'loop':
                // Small loop pattern: sin²(θ)
                const thetaRadLoop = theta * Math.PI / 180;
                gain = Math.pow(Math.sin(thetaRadLoop), 2);
                break;
                
            case 'yagi':
                // Simplified Yagi pattern with front/back ratio
                const frontGain = parameters.gain || 10;
                const frontToBack = parameters.frontToBack || 20;
                const thetaRadYagi = (theta - 0) * Math.PI / 180; // 0° is forward
                
                if (theta <= 90 || theta >= 270) {
                    gain = Math.cos(thetaRadYagi) * frontGain;
                } else {
                    gain = frontGain / Math.pow(10, frontToBack / 10);
                }
                gain = Math.max(0, gain);
                break;
                
            default:
                // Isotropic pattern
                gain = 1;
        }
        
        pattern.push(10 * Math.log10(Math.max(0.001, gain))); // Convert to dB
    }
    
    return createFrequencyPlot('chart-canvas', angles, pattern, {
        label: 'Gain (dBi)',
        xLabel: 'Angle (degrees)',
        yLabel: 'Gain (dBi)',
        title: `${antennaType.toUpperCase()} Radiation Pattern`,
        color: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)'
    });
}

/**
 * Plot reactance vs frequency
 * @param {string} componentType - 'inductor' or 'capacitor'
 * @param {number} value - Component value in SI units
 * @param {number} centerFreq - Center frequency in Hz
 */
function plotReactancevsFrequency(componentType, value, centerFreq) {
    const frequencies = [];
    const reactances = [];
    const steps = 100;
    const freqRange = 2; // ±200% around center frequency
    
    for (let i = 0; i < steps; i++) {
        const freq = centerFreq * (0.1 + (freqRange * i) / (steps - 1));
        frequencies.push(freq);
        
        let reactance;
        if (componentType === 'inductor') {
            reactance = inductiveReactance(freq, value);
        } else {
            reactance = capacitiveReactance(freq, value);
        }
        
        reactances.push(reactance);
    }
    
    return createFrequencyPlot('chart-canvas', frequencies, reactances, {
        label: `${componentType === 'inductor' ? 'X_L' : 'X_C'} (Ω)`,
        yLabel: 'Reactance (Ω)',
        title: `${componentType.toUpperCase()} Reactance vs Frequency`,
        color: componentType === 'inductor' ? 'rgb(255, 159, 64)' : 'rgb(153, 102, 255)',
        backgroundColor: componentType === 'inductor' ? 
            'rgba(255, 159, 64, 0.1)' : 'rgba(153, 102, 255, 0.1)'
    });
}

/**
 * Plot path loss vs distance
 * @param {number} frequency - Frequency in Hz
 * @param {Array} distances - Array of distances in meters
 */
function plotPathLoss(frequency, distances) {
    const pathLosses = distances.map(d => freeSpacePathLoss(frequency, d));
    const distancesKm = distances.map(d => d / 1000);
    
    return createFrequencyPlot('chart-canvas', distancesKm, pathLosses, {
        label: 'Path Loss (dB)',
        xLabel: 'Distance (km)',
        yLabel: 'Path Loss (dB)',
        title: `Free Space Path Loss @ ${formatNumber(frequency / 1e6, 1)} MHz`,
        color: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)'
    });
}

/**
 * Plot Smith Chart (simplified)
 * @param {Array} impedances - Array of complex impedances {real, imaginary}
 */
function plotSmithChart(impedances) {
    // This would be a complex implementation
    // For now, just show impedance magnitude vs phase
    const magnitudes = impedances.map(z => Math.sqrt(z.real * z.real + z.imaginary * z.imaginary));
    const phases = impedances.map(z => Math.atan2(z.imaginary, z.real) * 180 / Math.PI);
    
    return createFrequencyPlot('chart-canvas', phases, magnitudes, {
        label: 'Impedance Magnitude (Ω)',
        xLabel: 'Phase (degrees)',
        yLabel: 'Magnitude (Ω)',
        title: 'Impedance Plot',
        color: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)'
    });
}

/**
 * Show chart modal with plot
 * @param {string} plotType - Type of plot to show
 * @param {Object} data - Data for the plot
 */
function showChart(plotType, data) {
    const canvas = document.getElementById('chart-canvas');
    if (!canvas) {
        console.error('Chart canvas not found');
        return;
    }
    
    // Make canvas visible
    canvas.style.display = 'block';
    canvas.style.position = 'fixed';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    canvas.style.backgroundColor = 'white';
    canvas.style.border = '2px solid #333';
    canvas.style.borderRadius = '8px';
    canvas.style.padding = '20px';
    canvas.style.zIndex = '1000';
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    
    // Add close button
    if (!document.getElementById('chart-close-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.id = 'chart-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '10px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'red';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.width = '30px';
        closeBtn.style.height = '30px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = hideChart;
        
        canvas.parentElement.appendChild(closeBtn);
    }
    
    // Create overlay
    let overlay = document.getElementById('chart-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'chart-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';
        overlay.onclick = hideChart;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    
    // Generate appropriate plot
    switch (plotType) {
        case 'vswr':
            plotVSWRvsFrequency(data.frequency, data.l, data.c, data.r);
            break;
        case 'radiation':
            plotRadiationPattern(data.antennaType, data.parameters);
            break;
        case 'reactance':
            plotReactancevsFrequency(data.componentType, data.value, data.frequency);
            break;
        case 'pathloss':
            plotPathLoss(data.frequency, data.distances);
            break;
        default:
            console.warn('Unknown plot type:', plotType);
    }
}

/**
 * Hide chart modal
 */
function hideChart() {
    const canvas = document.getElementById('chart-canvas');
    const overlay = document.getElementById('chart-overlay');
    const closeBtn = document.getElementById('chart-close-btn');
    
    if (canvas) canvas.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    if (closeBtn) closeBtn.remove();
    
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

/**
 * Export chart as PNG
 */
function exportChart() {
    if (!currentChart) {
        alert('No chart to export');
        return;
    }
    
    const canvas = currentChart.canvas;
    const url = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = 'freqradio-chart.png';
    link.href = url;
    link.click();
}

/**
 * Export data as CSV
 * @param {Array} data - Array of data objects
 * @param {string} filename - Filename for the CSV
 */
function exportCSV(data, filename = 'freqradio-data.csv') {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Handle strings with commas
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
}