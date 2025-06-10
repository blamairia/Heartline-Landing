/**
 * ECG Operations JavaScript Module
 * Handles ECG file upload and real-time analysis functionality
 */

/**
 * Initialize ECG analysis functionality
 */
function initializeECGAnalysis() {
    const matFileInput = document.getElementById('ecg_mat_file');
    const heaFileInput = document.getElementById('ecg_hea_file');
    
    if (matFileInput && heaFileInput) {
        matFileInput.addEventListener('change', checkAndAnalyzeECG);
        heaFileInput.addEventListener('change', checkAndAnalyzeECG);
        console.log('ECG analysis event listeners attached');
    } else {
        console.warn('ECG file inputs not found');
    }
}

/**
 * Check if both ECG files are uploaded and trigger analysis
 */
function checkAndAnalyzeECG() {
    const matFile = document.getElementById('ecg_mat_file').files[0];
    const heaFile = document.getElementById('ecg_hea_file').files[0];
    
    console.log('ECG files check - MAT:', !!matFile, 'HEA:', !!heaFile);
    
    const section = document.getElementById('ecg-analysis-section');
    const banner = section?.querySelector('.alert.alert-info');
    const spinner = document.getElementById('ecg-analysis-loading');
    const results = document.getElementById('ecg-analysis-results');
    const errorBox = document.getElementById('ecg-analysis-error');
    
    // Make wrapper + banner visible at the very first click
    if (section) section.style.display = 'block';
    if (banner) banner.style.display = 'block';
    
    // Nothing to analyse until both files are selected
    if (!(matFile && heaFile)) {
        if (spinner) spinner.style.display = 'none';
        if (results) results.style.display = 'none';
        if (errorBox) errorBox.style.display = 'none';
        return; // stop here – don't fire request yet
    }
    
    // Both files are present – show spinner and launch request
    if (spinner) spinner.style.display = 'block';
    if (results) results.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';
    
    console.log('Both ECG files present, starting analysis...');
    
    // Start the actual analysis
    analyzeECGFiles(matFile, heaFile);
}

/**
 * Send ECG files to backend for analysis
 */
function analyzeECGFiles(matFile, heaFile) {
    console.log('Sending ECG files for analysis...');
    
    const spinner = document.getElementById('ecg-analysis-loading');
    const results = document.getElementById('ecg-analysis-results');
    const errorBox = document.getElementById('ecg-analysis-error');
    
    const formData = new FormData();
    formData.append('mat_file', matFile);
    formData.append('hea_file', heaFile);
    
    fetch('/analyze_ecg', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('ECG analysis response received:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('ECG analysis data:', data);
        
        if (spinner) spinner.style.display = 'none';
        
        if (data.success) {
            displayECGResults(data);
            if (results) {
                results.style.display = 'block';
                // Force show the results container
                results.style.visibility = 'visible';
                results.style.opacity = '1';
            }
        } else {
            console.error('ECG analysis failed:', data.error);
            if (errorBox) {
                errorBox.textContent = data.error || 'Analysis failed';
                errorBox.style.display = 'block';
            }
        }
    })
    .catch(error => {
        console.error('ECG analysis network error:', error);
        
        if (spinner) spinner.style.display = 'none';
        if (errorBox) {
            errorBox.textContent = 'Network error: ' + error.message;
            errorBox.style.display = 'block';
        }
    });
}

/**
 * Display ECG analysis results in the UI
 */
function displayECGResults(data) {
    console.log('Displaying ECG results:', data);
    
    // Update primary diagnosis
    const primaryDiagnosis = document.getElementById('primary-diagnosis');
    if (primaryDiagnosis) {
        primaryDiagnosis.textContent = data.primary_diagnosis.name;
    }
    
    // Update confidence level
    const confidence = (data.primary_diagnosis.probability * 100).toFixed(1) + '%';
    const confidenceEl = document.getElementById('confidence-level');
    if (confidenceEl) {
        confidenceEl.textContent = confidence;
        
        // Set color based on confidence level
        confidenceEl.className = 'font-weight-bold ';
        if (data.primary_diagnosis.probability > 0.7) {
            confidenceEl.className += 'text-success';
        } else if (data.primary_diagnosis.probability > 0.5) {
            confidenceEl.className += 'text-warning';
        } else {
            confidenceEl.className += 'text-danger';
        }
    }
    
    // Update detailed probabilities
    const detailedProbs = document.getElementById('detailed-probabilities');
    if (detailedProbs) {
        const classNames = {
            'SNR': 'Sinus Rhythm',
            'AF': 'Atrial Fibrillation',
            'IAVB': 'AV Block',
            'LBBB': 'Left Bundle Branch Block',
            'RBBB': 'Right Bundle Branch Block',
            'PAC': 'Premature Atrial Contraction',
            'PVC': 'Premature Ventricular Contraction',
            'STD': 'ST Depression',
            'STE': 'ST Elevation'
        };
        
        let html = '<div class="row">';
        for (const [abbr, probability] of Object.entries(data.probabilities)) {
            const percentage = (probability * 100).toFixed(1);
            const className = classNames[abbr] || abbr;
            
            html += `
                <div class="col-md-6 mb-2">
                    <small><strong>${className} (${abbr}):</strong> ${percentage}%</small>
                    <div class="progress" style="height:5px;">
                        <div class="progress-bar" role="progressbar" style="width:${percentage}%"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        detailedProbs.innerHTML = html;
    }
    
    // Display ECG waveform if data is available
    if (data.ecg && data.ecg.time && data.ecg.signals) {
        displayECGWaveform(data.ecg);
    } else {
        showWaveformError('ECG waveform data not available');
    }
    
    console.log('ECG results displayed successfully');
}

// Make functions globally available for external access if needed
window.ECGOperations = {
    initializeECGAnalysis,
    checkAndAnalyzeECG,
    analyzeECGFiles,
    displayECGResults
};

// Also make checkAndAnalyzeECG globally available for HTML onchange attributes
window.checkAndAnalyzeECG = checkAndAnalyzeECG;

// Global variables for ECG chart
let ecgChart = null;
let currentECGData = null;
let currentLead = 0;

// ECG Lead names mapping
const ECG_LEADS = [
    'Lead I', 'Lead II', 'Lead III', 'aVR', 'aVL', 'aVF',
    'V1', 'V2', 'V3', 'V4', 'V5', 'V6'
];

/**
 * Display ECG waveform with medical-grade scaling and lead selection
 */
function displayECGWaveform(ecgData) {
    console.log('Displaying ECG waveform:', ecgData);
    
    const loadingEl = document.getElementById('ecg-waveform-loading');
    const errorEl = document.getElementById('ecg-waveform-error');
    const canvas = document.getElementById('ecg-waveform-chart');
    const controlsContainer = document.getElementById('ecg-controls');
    
    if (!canvas) {
        console.error('ECG waveform canvas not found');
        showWaveformError('Waveform canvas not available');
        return;
    }
    
    // Show loading state
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';
    
    try {
        // Validate data structure
        if (!ecgData.time || !ecgData.signals || !Array.isArray(ecgData.time) || !Array.isArray(ecgData.signals)) {
            throw new Error('Invalid ECG data structure');
        }
        
        if (ecgData.signals.length === 0) {
            throw new Error('No ECG signal data available');
        }
        
        // Store ECG data globally for lead switching
        currentECGData = ecgData;
        
        // Create lead selection controls
        createLeadControls(ecgData.signals.length);
        
        // Display the chart with the current lead
        updateECGChart();
        
        // Hide loading state
        if (loadingEl) loadingEl.style.display = 'none';
        
        console.log('ECG waveform displayed successfully');
        
    } catch (error) {
        console.error('Error displaying ECG waveform:', error);
        showWaveformError(error.message || 'Failed to render waveform');
    }
}

/**
 * Create lead selection controls
 */
function createLeadControls(numberOfLeads) {
    const controlsContainer = document.getElementById('ecg-controls');
    if (!controlsContainer) return;
    
    let controlsHTML = `
        <div class="card mb-3">
            <div class="card-body py-2">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <label for="lead-selector" class="form-label mb-1"><strong>Select ECG Lead:</strong></label>
                        <select id="lead-selector" class="form-control form-control-sm">
    `;
    
    // Add available leads based on number of signals
    for (let i = 0; i < numberOfLeads && i < ECG_LEADS.length; i++) {
        const selected = i === currentLead ? 'selected' : '';
        controlsHTML += `<option value="${i}" ${selected}>${ECG_LEADS[i]}</option>`;
    }
    
    controlsHTML += `
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label mb-1"><strong>Standard ECG Scale:</strong></label>
                        <div class="text-muted small">
                            <i class="fas fa-ruler"></i> 25mm/s | 10mm/mV
                        </div>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label mb-1"><strong>Grid Reference:</strong></label>
                        <div class="text-muted small">
                            <i class="fas fa-th"></i> 1 small box = 40ms × 0.1mV
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    controlsContainer.innerHTML = controlsHTML;
    
    // Add event listener for lead selection
    const leadSelector = document.getElementById('lead-selector');
    if (leadSelector) {
        leadSelector.addEventListener('change', function() {
            currentLead = parseInt(this.value);
            updateECGChart();
        });
    }
}

/**
 * Update ECG chart with current lead selection - Custom Canvas Implementation
 */
function updateECGChart() {
    if (!currentECGData || !currentECGData.time || !currentECGData.signals) {
        return;
    }
    
    const canvas = document.getElementById('ecg-waveform-chart');
    if (!canvas) return;
    
    const timeData = currentECGData.time;
    const signalData = currentECGData.signals[currentLead];
    
    if (!signalData || timeData.length !== signalData.length) {
        console.error('Invalid signal data for lead', currentLead);
        return;
    }
    
    // Set fixed canvas dimensions for realistic ECG paper size
    // Standard ECG paper with margins for axes
    const MARGIN_LEFT = 80;   // Space for Y-axis labels
    const MARGIN_RIGHT = 40;  // Right margin
    const MARGIN_TOP = 60;    // Top margin for title
    const MARGIN_BOTTOM = 80; // Space for X-axis labels
    
    const plotWidth = 1000;   // Actual plot area width
    const plotHeight = 600;   // Actual plot area height
    
    const canvasWidth = plotWidth + MARGIN_LEFT + MARGIN_RIGHT;
    const canvasHeight = plotHeight + MARGIN_TOP + MARGIN_BOTTOM;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    
    // Medical ECG scaling constants (EXACT as real ECG)
    // 1 small box = 1mm = 40ms horizontally, 0.1mV vertically
    const PIXELS_PER_MM = 4;
    const SMALL_BOX_SIZE = 4; // 4 pixels = 1mm
    const LARGE_BOX_SIZE = 20; // 20 pixels = 5mm (5 small boxes)
    
    // Time scaling: 25mm/s means 1mm = 40ms
    const TIME_PER_MM = 0.04; // 40ms per mm
    const TIME_PER_PIXEL = TIME_PER_MM / PIXELS_PER_MM; // 10ms per pixel
    
    // Voltage scaling: 10mm/mV means 1mm = 0.1mV
    const VOLTAGE_PER_MM = 0.1; // 0.1mV per mm
    const VOLTAGE_PER_PIXEL = VOLTAGE_PER_MM / PIXELS_PER_MM; // 0.025mV per pixel
    
    // Clear entire canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Fill plot area with ECG paper color
    ctx.fillStyle = '#FFF8DC'; // Cream/orange ECG paper color
    ctx.fillRect(MARGIN_LEFT, MARGIN_TOP, plotWidth, plotHeight);
    
    // Draw ECG grid in plot area only
    drawECGGrid(ctx, plotWidth, plotHeight, MARGIN_LEFT, MARGIN_TOP);
    
    // Calculate data bounds and scaling
    const minTime = Math.min(...timeData);
    const maxTime = Math.max(...timeData);
    const minVoltage = Math.min(...signalData);
    const maxVoltage = Math.max(...signalData);
    
    // Use actual data range for better visualization
    const dataDuration = maxTime - minTime;
    const dataVoltageRange = maxVoltage - minVoltage;
    
    // Calculate display window - show full data with some padding
    const timePadding = dataDuration * 0.05; // 5% padding
    const voltagePadding = Math.max(dataVoltageRange * 0.1, 0.5); // 10% padding or minimum 0.5mV
    
    const timeStart = minTime - timePadding;
    const timeEnd = maxTime + timePadding;
    const voltageStart = minVoltage - voltagePadding;
    const voltageEnd = maxVoltage + voltagePadding;
    
    const displayDuration = timeEnd - timeStart;
    const displayVoltageRange = voltageEnd - voltageStart;
    
    // Draw axes and labels
    drawAxes(ctx, MARGIN_LEFT, MARGIN_TOP, plotWidth, plotHeight, timeStart, timeEnd, voltageStart, voltageEnd);
    
    // Draw lead label
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(ECG_LEADS[currentLead] || `Lead ${currentLead + 1}`, canvasWidth / 2, 30);
    
    // Draw ECG waveform
    ctx.beginPath();
    ctx.strokeStyle = '#000000'; // Black line exactly like real ECG
    ctx.lineWidth = 2;
    
    let firstPoint = true;
    
    for (let i = 0; i < timeData.length; i++) {
        const time = timeData[i];
        const voltage = signalData[i];
        
        // Convert to canvas coordinates within plot area
        const x = MARGIN_LEFT + ((time - timeStart) / displayDuration) * plotWidth;
        const y = MARGIN_TOP + plotHeight - ((voltage - voltageStart) / displayVoltageRange) * plotHeight;
        
        // Only draw points within plot bounds
        if (time >= timeStart && time <= timeEnd && voltage >= voltageStart && voltage <= voltageEnd) {
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
    }
    
    ctx.stroke();
    
    // Add interactive hover functionality
    addCanvasInteractivity(canvas, timeStart, voltageStart, displayDuration, displayVoltageRange, MARGIN_LEFT, MARGIN_TOP, plotWidth, plotHeight);
    
    console.log(`ECG waveform updated for ${ECG_LEADS[currentLead]} with realistic scaling`);
}

/**
 * Draw ECG grid exactly like real ECG paper
 */
function drawECGGrid(ctx, width, height, offsetX, offsetY) {
    const SMALL_BOX = 4; // 1mm = 4 pixels
    const LARGE_BOX = 20; // 5mm = 20 pixels
    
    // Save current transform
    ctx.save();
    ctx.translate(offsetX, offsetY);
    
    // Draw small grid lines (1mm squares)
    ctx.strokeStyle = '#FF8C42'; // Light orange for small grid
    ctx.lineWidth = 0.5;
    
    // Vertical small grid lines
    for (let x = 0; x <= width; x += SMALL_BOX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Horizontal small grid lines
    for (let y = 0; y <= height; y += SMALL_BOX) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw large grid lines (5mm squares)
    ctx.strokeStyle = '#FF6B35'; // Darker orange for large grid
    ctx.lineWidth = 1.0;
    
    // Vertical large grid lines
    for (let x = 0; x <= width; x += LARGE_BOX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Horizontal large grid lines
    for (let y = 0; y <= height; y += LARGE_BOX) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Restore transform
    ctx.restore();
}

/**
 * Draw axes and labels for the ECG chart
 */
function drawAxes(ctx, marginLeft, marginTop, plotWidth, plotHeight, timeStart, timeEnd, voltageStart, voltageEnd) {
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Draw main axes
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + plotHeight);
    // X-axis
    ctx.moveTo(marginLeft, marginTop + plotHeight);
    ctx.lineTo(marginLeft + plotWidth, marginTop + plotHeight);
    ctx.stroke();
    
    // X-axis labels (Time in seconds)
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    
    const timeRange = timeEnd - timeStart;
    const timeStep = timeRange / 10; // 10 time divisions
    
    for (let i = 0; i <= 10; i++) {
        const time = timeStart + (i * timeStep);
        const x = marginLeft + (i * plotWidth / 10);
        
        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(x, marginTop + plotHeight);
        ctx.lineTo(x, marginTop + plotHeight + 5);
        ctx.stroke();
        
        // Draw label
        ctx.fillText(time.toFixed(2) + 's', x, marginTop + plotHeight + 20);
    }
    
    // X-axis title
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Time (s)', marginLeft + plotWidth / 2, marginTop + plotHeight + 50);
    
    // Y-axis labels (Voltage in mV)
    ctx.textAlign = 'right';
    ctx.font = '12px Arial';
    
    const voltageRange = voltageEnd - voltageStart;
    const voltageStep = voltageRange / 10; // 10 voltage divisions
    
    for (let i = 0; i <= 10; i++) {
        const voltage = voltageStart + (i * voltageStep);
        const y = marginTop + plotHeight - (i * plotHeight / 10);
        
        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(marginLeft - 5, y);
        ctx.lineTo(marginLeft, y);
        ctx.stroke();
        
        // Draw label
        ctx.fillText(voltage.toFixed(1) + 'mV', marginLeft - 10, y + 4);
    }
    
    // Y-axis title
    ctx.save();
    ctx.translate(20, marginTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Amplitude (mV)', 0, 0);
    ctx.restore();
}

/**
 * Add interactive hover functionality to canvas
 */
function addCanvasInteractivity(canvas, timeStart, voltageStart, displayDuration, displayVoltageRange, marginLeft, marginTop, plotWidth, plotHeight) {
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '1000';
    document.body.appendChild(tooltip);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if mouse is within plot area
        if (x >= marginLeft && x <= marginLeft + plotWidth && y >= marginTop && y <= marginTop + plotHeight) {
            // Convert canvas coordinates back to time and voltage
            const time = timeStart + ((x - marginLeft) / plotWidth) * displayDuration;
            const voltage = voltageStart + ((marginTop + plotHeight - y) / plotHeight) * displayVoltageRange;
            
            // Show tooltip
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY - 10) + 'px';
            tooltip.innerHTML = `
                <div><strong>Time:</strong> ${time.toFixed(4)}s</div>
                <div><strong>${ECG_LEADS[currentLead]}:</strong> ${voltage.toFixed(3)}mV</div>
                <div><strong>Grid:</strong> ${Math.round(time/0.04)} × ${Math.round(voltage/0.1)} boxes</div>
            `;
        } else {
            tooltip.style.display = 'none';
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
    
    // Clean up previous tooltip if it exists
    const existingTooltips = document.querySelectorAll('[data-ecg-tooltip]');
    existingTooltips.forEach(t => t.remove());
    tooltip.setAttribute('data-ecg-tooltip', 'true');
}

/**
 * Show waveform error message
 */
function showWaveformError(message) {
    const loadingEl = document.getElementById('ecg-waveform-loading');
    const errorEl = document.getElementById('ecg-waveform-error');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
        errorEl.style.display = 'block';
        const errorMsg = errorEl.querySelector('p');
        if (errorMsg) {
            errorMsg.textContent = message;
        }
    }
    
    // Destroy existing chart if it exists
    if (ecgChart) {
        ecgChart.destroy();
        ecgChart = null;
    }
}
