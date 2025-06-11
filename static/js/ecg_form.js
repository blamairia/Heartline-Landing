'use strict';

/**
 * ECG Form Submission Script
 * Handles ECG file upload and real-time analysis for NEW visit forms
 * This script is ONLY for form submission - NOT for editing existing visits
 */
class ECGFormSubmissionHandler {
  constructor() {
    // File inputs & main containers
    this.matFileInput      = null;
    this.heaFileInput      = null;
    this.analysisSection   = null;
    this.analysisResults   = null;
    this.analysisLoading   = null;
    this.analysisError     = null;

    // Waveform sub-components
    this.waveformContainer = null;
    this.waveformLoading   = null;
    this.waveformError     = null;
    this.waveformControls  = null;
    this.waveformChart     = null;

    // Data state
    this.currentECGData    = null;
    this.currentLead       = 0;
    this.ECG_LEADS         = [
      'Lead I', 'Lead II', 'Lead III', 'aVR', 'aVL', 'aVF',
      'V1', 'V2', 'V3', 'V4', 'V5', 'V6'
    ];

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeElements());
    } else {
      this.initializeElements();
    }
  }

  initializeElements() {
    // Grab DOM nodes
    this.matFileInput    = document.getElementById('ecg_mat_file');
    this.heaFileInput    = document.getElementById('ecg_hea_file');
    this.analysisSection = document.getElementById('ecg-analysis-section');

    if (!this.matFileInput || !this.heaFileInput || !this.analysisSection) {
      console.warn('ECG Form Submission: Required elements for analysis not found');
      return;
    }

    this.analysisResults = document.getElementById('ecg-analysis-results');
    this.analysisLoading = document.getElementById('ecg-analysis-loading');
    this.analysisError   = document.getElementById('ecg-analysis-error');

    // Waveform specific elements from static HTML
    this.waveformDisplayArea = document.getElementById('ecg-waveform-display-area');
    this.waveformLoading = document.getElementById('ecg-waveform-loading');
    this.waveformError = document.getElementById('ecg-waveform-error');
    this.waveformControls = document.getElementById('ecg-controls');
    this.waveformChartCanvas = document.getElementById('ecg-waveform-chart');
    this.ecgChart = null; // For Chart.js instance

    if (!this.waveformDisplayArea || !this.waveformLoading || !this.waveformError || !this.waveformControls || !this.waveformChartCanvas) {
        console.warn('ECG Form Submission: Required elements for waveform display not found. Ensure they exist in visit_form.html.');
        // Decide if this is a fatal error for the class or if it can proceed without waveform functionality.
        // For now, we'll allow it to proceed, but waveform features will not work.
    }

    // Ensure analysis spinner & error are hidden initially
    if (this.analysisLoading) this.analysisLoading.style.display = 'none';
    if (this.analysisError) this.analysisError.style.display   = 'none';

    // Hide the entire waveform display area initially
    this.hideWaveformDisplay(); 

    this.showInstructionMessage();
    this.attachEventListeners();
    console.log('ECG Form Submission handler initialized');
  }

  attachEventListeners() {
    this.matFileInput.addEventListener('change', () => this.checkAndAnalyzeECG());
    this.heaFileInput.addEventListener('change', () => this.checkAndAnalyzeECG());
  }

  checkAndAnalyzeECG() {
    const matFile = this.matFileInput.files[0];
    const heaFile = this.heaFileInput.files[0];
    console.log('ECG files check – MAT:', !!matFile, 'HEA:', !!heaFile);

    if (matFile && heaFile) {
      this.showAnalysisSection();
      this.analyzeECGFiles(matFile, heaFile);
    } else if (matFile || heaFile) {
      this.showWaitingForBothFiles();
    } else {
      this.showInstructionMessage();
    }
  }

  showAnalysisSection() {
  // un-hide the container
  this.analysisSection.style.display = 'block';

  // un-hide the top‐level alert
  const banner = this.analysisSection.querySelector('.alert.alert-info');
  if (banner) banner.style.display = 'block';

  // un-hide the nested instruction/results banner
  const inner = document.querySelector('#ecg-analysis-results .alert');
  if (inner) inner.style.display = 'block';
}

  showWaitingForBothFiles() {
    this.clearError();
    this.hideLoading();
    this.analysisResults.innerHTML = `
      <div class="alert alert-warning">
        <h6><i class="fas fa-clock"></i> Waiting for Both ECG Files</h6>
        <p>Please select both MAT and HEA files to perform ECG analysis.</p>
      </div>`;
  }

  showInstructionMessage() {
    this.clearError();
    this.hideLoading();
    this.analysisResults.innerHTML = `
      <div class="alert alert-info">
        <h6><i class="fas fa-info-circle"></i> ECG Analysis Ready</h6>
        <p>Upload ECG files (MAT and HEA) above to get real-time results here.</p>
        <small class="text-muted">Both files are required for complete analysis.</small>
      </div>`;
  }

  showLoading() {
    this.clearError();
    this.analysisLoading.style.display = 'block';
  }

  hideLoading() {
    this.analysisLoading.style.display = 'none';
  }

  clearError() {
    this.analysisError.textContent = '';
    this.analysisError.style.display = 'none';
  }

  analyzeECGFiles(matFile, heaFile) {
    console.log('Sending ECG files for analysis…');
    this.showLoading();
    this.analysisResults.innerHTML = ''; 
    this.hideWaveformDisplay(); // Hide waveform display during analysis

    const formData = new FormData();
    formData.append('mat_file', matFile);
    formData.append('hea_file', heaFile);

    fetch('/analyze_ecg', { method: 'POST', body: formData })
      .then(response => {
        if (!response.ok) {
          // Try to parse error from server if it's JSON
          return response.json().then(errData => {
            throw new Error(errData.error || `Server returned ${response.status}`);
          }).catch(() => { // Fallback if error response is not JSON
            throw new Error(`Server returned ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        this.hideLoading();
        if (data.success) {
          this.displayAnalysisResults(data);
          // Now, also fetch and display the waveform
          this.fetchAndDisplayWaveform(matFile, heaFile);
        } else {
          throw new Error(data.error || 'Unknown analysis error');
        }
      })
      .catch(err => {
        console.error('ECG analysis error:', err);
        this.hideLoading();
        this.displayError(err.message);
        // Clear results area if an error occurs to prevent showing stale/confusing info
        this.analysisResults.innerHTML = '';
      });
  }

  displayAnalysisResults(data) {
    const primaryAbbr = data.primary_diagnosis.abbreviation;
    const primaryName = data.primary_diagnosis.name;
    const primaryProb = data.primary_diagnosis.probability;
    const summary = data.summary;
    const confidencePct = (primaryProb * 100).toFixed(1) + '%';

    let confidenceClass = 'text-danger';
    if (primaryProb > 0.7) {
      confidenceClass = 'text-success';
    } else if (primaryProb > 0.5) {
      confidenceClass = 'text-warning';
    }

    const detailedProbsHtml = this.getDetailedProbabilitiesHtml(data.probabilities);

    this.analysisResults.innerHTML = `
      <div class="row mb-3">
        <div class="col-md-8">
          <h6>Primary Diagnosis:</h6>
          <div class="font-weight-bold text-primary">${primaryName} (${primaryAbbr})</div>
        </div>
        <div class="col-md-4">
          <h6>Confidence:</h6>
          <div class="font-weight-bold ${confidenceClass}">${confidencePct}</div>
        </div>
      </div>
      <div class="mb-3">
        <h6>Summary:</h6>
        <p class="mb-0">${summary}</p>
      </div>
      <div class="mt-3">
        <h6>Detailed Probabilities:</h6>
        ${detailedProbsHtml}
      </div>
    `;
    console.log('ECG analysis results displayed with abbreviation and summary');
  }

  // Renamed from displayDetailedProbabilities to reflect it returns HTML string
  getDetailedProbabilitiesHtml(probabilities) {
    let html = '<div class="row">';
    for (const [abbr, p] of Object.entries(probabilities)) {
      const pct = (p * 100).toFixed(1);
      // You might want a mapping from abbr to full name here if available
      const displayName = abbr; // Placeholder: use actual names if you have them
      html += `
        <div class="col-md-6 mb-2">
          <small><strong>${displayName}:</strong> ${pct}%</small>
          <div class="progress" style="height:5px;">
            <div class="progress-bar" role="progressbar" style="width:${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>`;
    }
    html += '</div>';
    return html;
  }

  displayError(msg) {
    this.analysisError.textContent = msg;
    this.analysisError.style.display = 'block';
  }

  fetchAndDisplayWaveform(matFile, heaFile) {
    console.log('Fetching ECG waveform data...');
    this.showWaveformLoading();
    this.waveformDisplayArea.style.display = 'block'; // Show the area

    const formData = new FormData();
    formData.append('mat_file', matFile);
    formData.append('hea_file', heaFile);

    fetch('/ecg_waveform_data', { method: 'POST', body: formData })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.error || `Server returned ${response.status} for waveform`);
          }).catch(() => {
            throw new Error(`Server returned ${response.status} for waveform`);
          });
        }
        return response.json();
      })
      .then(data => {
        this.hideWaveformLoading();
        if (data.success && data.ecg_data) {
          this.currentECGData = data.ecg_data;
          this.currentLead = 0; // Default to first lead
          this.createLeadControls(this.currentECGData.n_leads, this.currentECGData.lead_names);
          this.displayECGWaveform();
        } else {
          throw new Error(data.error || 'Unknown error fetching waveform data');
        }
      })
      .catch(err => {
        console.error('Waveform data error:', err);
        this.hideWaveformLoading();
        this.showWaveformError(err.message);
      });
  }

  showWaveformLoading() {
    if (this.waveformLoading) this.waveformLoading.style.display = 'block';
    if (this.waveformError) this.waveformError.style.display = 'none';
    if (this.waveformChartCanvas) this.waveformChartCanvas.style.display = 'none';
    if (this.waveformControls) this.waveformControls.innerHTML = '';
  }

  hideWaveformLoading() {
    if (this.waveformLoading) this.waveformLoading.style.display = 'none';
  }

  showWaveformError(msg) {
    if (this.waveformError) {
      this.waveformError.textContent = 'Error loading waveform: ' + msg;
      this.waveformError.style.display = 'block';
    }
    if (this.waveformChartCanvas) this.waveformChartCanvas.style.display = 'none';
    if (this.waveformControls) this.waveformControls.innerHTML = '';
  }
  
  hideWaveformDisplay() {
    if (this.waveformDisplayArea) this.waveformDisplayArea.style.display = 'none';
    if (this.waveformError) this.waveformError.style.display = 'none';
    if (this.waveformLoading) this.waveformLoading.style.display = 'none';
    if (this.waveformChartCanvas) this.waveformChartCanvas.style.display = 'none';
    if (this.waveformControls) this.waveformControls.innerHTML = '';
     if (this.ecgChart) {
        this.ecgChart.destroy();
        this.ecgChart = null;
    }
  }

  displayECGWaveform() {
    if (!this.currentECGData || !this.waveformChartCanvas) {
      this.showWaveformError('ECG data or chart canvas not available.');
      return;
    }
    if (this.waveformError) this.waveformError.style.display = 'none';
    this.waveformChartCanvas.style.display = 'block';

    const { time, signals, lead_names, sampling_rate } = this.currentECGData;
    const currentSignal = signals[this.currentLead];

    if (this.ecgChart) {
      this.ecgChart.destroy();
    }

    const ctx = this.waveformChartCanvas.getContext('2d');
    this.ecgChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: time,
        datasets: [{
          label: lead_names[this.currentLead],
          data: currentSignal,
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 1,
          fill: false,
          pointRadius: 0, // No points for cleaner line
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (s)'
            },
            ticks: {
                maxTicksLimit: 20 // Limit number of X-axis ticks for readability
            }
          },
          y: {
            title: {
              display: true,
              text: 'Amplitude (mV)'
            }
          }
        },
        plugins: {
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
          },
          zoom: { // Basic zoom and pan, if Chart.js zoom plugin is available
            pan: {
              enabled: true,
              mode: 'xy',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy',
            }
          }
        }
      }
    });
    console.log(`Displaying waveform for lead: ${lead_names[this.currentLead]}`);
  }

  createLeadControls(numberOfLeads, leadNames) {
    if (!this.waveformControls) return;
    
    let controlsHTML = `
      <div class="row align-items-center">
        <div class="col-md-4">
          <label for="lead-selector" class="form-label mb-1"><strong>Select ECG Lead:</strong></label>
          <select id="lead-selector" class="form-control form-control-sm">
    `;
    
    for (let i = 0; i < numberOfLeads; i++) {
      const leadName = leadNames[i] || `Lead ${i + 1}`;
      controlsHTML += `<option value="${i}" ${this.currentLead === i ? 'selected' : ''}> ${leadName}</option>`;
    }
    
    controlsHTML += `
          </select>
        </div>
      </div>
    `;
    
    this.waveformControls.innerHTML = controlsHTML;
    
    const leadSelector = document.getElementById('lead-selector');
    if (leadSelector) {
      leadSelector.addEventListener('change', (event) => {
        this.currentLead = parseInt(event.target.value, 10);
        this.displayECGWaveform();
      });
    }
  }

  // Make sure to call hideWaveformDisplay in initializeElements or constructor if it should be hidden initially
  // ... (rest of the class) ...
}

// Auto-initialize
window.ECGFormSubmissionHandler = ECGFormSubmissionHandler;
let ecgFormHandler = null;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ecgFormHandler = new ECGFormSubmissionHandler();
  });
} else {
  ecgFormHandler = new ECGFormSubmissionHandler();
}
