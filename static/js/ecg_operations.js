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

// Global variable to store the chart instance
let ecgChart = null;

/**
 * Display ECG waveform using Chart.js
 */
function displayECGWaveform(ecgData) {
    console.log('Displaying ECG waveform:', ecgData);
    
    const loadingEl = document.getElementById('ecg-waveform-loading');
    const errorEl = document.getElementById('ecg-waveform-error');
    const canvas = document.getElementById('ecg-waveform-chart');
    
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
        
        // Use Lead I (first signal) by default
        const timeData = ecgData.time;
        const signalData = ecgData.signals[0]; // Lead I
        
        if (timeData.length !== signalData.length) {
            throw new Error('Time and signal data length mismatch');
        }
        
        // Prepare data for Chart.js
        const chartData = timeData.map((time, index) => ({
            x: time,
            y: signalData[index]
        }));
        
        // Calculate data range for better scaling
        const minTime = Math.min(...timeData);
        const maxTime = Math.max(...timeData);
        const minSignal = Math.min(...signalData);
        const maxSignal = Math.max(...signalData);
        
        // Add some padding to the signal range
        const signalPadding = (maxSignal - minSignal) * 0.1;
        const yMin = minSignal - signalPadding;
        const yMax = maxSignal + signalPadding;
        
        // Destroy existing chart if it exists
        if (ecgChart) {
            ecgChart.destroy();
            ecgChart = null;
        }
        
        // Get canvas context
        const ctx = canvas.getContext('2d');
        
        // Register zoom plugin
        if (typeof Chart !== 'undefined' && Chart.register) {
            try {
                Chart.register(ChartZoom);
            } catch (e) {
                console.warn('Chart zoom plugin not available:', e);
            }
        }
        
        // Create the chart
        ecgChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Lead I',
                    data: chartData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    tension: 0,
                    spanGaps: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animation for performance
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Time (s)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        min: minTime,
                        max: maxTime,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            maxTicksLimit: 20,
                            callback: function(value) {
                                return value.toFixed(3);
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amplitude (mV)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        min: yMin,
                        max: yMax,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(3);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'nearest',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return `Time: ${context[0].parsed.x.toFixed(4)} s`;
                            },
                            label: function(context) {
                                return `Amplitude: ${context.parsed.y.toFixed(4)} mV`;
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy',
                            modifierKey: null
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                modifierKey: null
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
        
        // Hide loading state
        if (loadingEl) loadingEl.style.display = 'none';
        
        console.log('ECG waveform displayed successfully');
        
    } catch (error) {
        console.error('Error displaying ECG waveform:', error);
        showWaveformError(error.message || 'Failed to render waveform');
    }
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
