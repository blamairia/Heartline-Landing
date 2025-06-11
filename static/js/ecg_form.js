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
      console.warn('ECG Form Submission: Required elements not found');
      return;
    }

    this.analysisResults = document.getElementById('ecg-analysis-results');
    this.analysisLoading = document.getElementById('ecg-analysis-loading');
    this.analysisError   = document.getElementById('ecg-analysis-error');

    // Ensure spinner & error are hidden initially
    this.analysisLoading.style.display = 'none';
    this.analysisError.style.display   = 'none';

    // Build waveform area if needed
    this.createWaveformContainer();

    // Grab waveform sub-elements
    this.waveformLoading   = document.getElementById('ecg-waveform-loading');
    this.waveformError     = document.getElementById('ecg-waveform-error');
    this.waveformControls  = document.getElementById('ecg-controls');
    this.waveformChart     = document.getElementById('ecg-waveform-chart');

    // Hide waveform parts initially
    this.waveformLoading.style.display   = 'none';
    this.waveformError.style.display     = 'none';
    this.waveformControls.style.display  = 'none';
    this.waveformChart.style.display     = 'none';

    // Kick off with the instruction message
    this.showInstructionMessage();
    this.attachEventListeners();
    console.log('ECG Form Submission handler initialized');
  }

  createWaveformContainer() {
    if (document.getElementById('ecg-waveform-container')) return;

    const waveformHTML = `
      <div id="ecg-waveform-container" class="mt-3">
        <div class="card">
          <div class="card-header">
            <h6><i class="fas fa-chart-line"></i> ECG Waveform</h6>
          </div>
          <div class="card-body">
            <div id="ecg-waveform-loading">
              <div class="text-center">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                Loading waveform...
              </div>
            </div>
            <div id="ecg-waveform-error" class="alert alert-danger"></div>
            <div id="ecg-controls"></div>
            <canvas id="ecg-waveform-chart" style="max-width: 100%; border: 1px solid #ddd;"></canvas>
          </div>
        </div>
      </div>
    `;
    this.analysisSection.insertAdjacentHTML('afterend', waveformHTML);
    this.waveformContainer = document.getElementById('ecg-waveform-container');
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
    // Clear previous results display before showing loading and making new request
    this.analysisResults.innerHTML = ''; // Clear out old messages or results

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
          // Since /analyze_ecg doesn't return waveform, we show a message.
          // If you expect waveform data from this endpoint in the future, this logic would change.
          this.showWaveformError('Waveform visualization not available for real-time analysis via this endpoint.');
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

  showWaveformError(msg) {
    if (this.waveformLoading) this.waveformLoading.style.display = 'none';
    if (this.waveformError) {
      this.waveformError.textContent = msg;
      this.waveformError.style.display = 'block';
    }
  }
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
