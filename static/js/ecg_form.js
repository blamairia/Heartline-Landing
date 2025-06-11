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

     // 1) Always keep the ECG panel visible
  this.analysisSection.style.display = 'block';

  // 2) Hide only the spinners & errors — but do NOT hide the waveform area or canvas
  if (this.analysisLoading) this.analysisLoading.style.display = 'none';
  if (this.analysisError)   this.analysisError.style.display   = 'none';
  if (this.waveformLoading) this.waveformLoading.style.display   = 'none';
  if (this.waveformError)   this.waveformError.style.display     = 'none';
  // *** Remove any this.hideWaveformDisplay() here ***

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
  this.analysisSection.style.display = 'block';
  this.analysisSection.querySelectorAll('*').forEach(el => el.style.removeProperty('display'));
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

  // === In your ECGFormSubmissionHandler class, replace displayECGWaveform: ===

  displayECGWaveform() {
    const data   = this.currentECGData;
    const canvas = this.waveformChartCanvas;
    if (!data || !canvas) {
      this.showWaveformError('No ECG waveform data or canvas available.');
      return;
    }

    // 1 mm = 4 px
    const PX_PER_MM  = 4;
    const SMALL_BOX  = PX_PER_MM;       // 1 mm
    const LARGE_BOX  = PX_PER_MM * 5;   // 5 mm

    // Increased margins for labels and breathing room
    const MARGIN_LEFT   = LARGE_BOX * 4;   // was 3
    const MARGIN_RIGHT  = LARGE_BOX * 2;  
    const MARGIN_TOP    = LARGE_BOX * 2;   // was 1.5
    const MARGIN_BOTTOM = LARGE_BOX * 4;   // was 3

    // Plot dimensions based on time
    const totalSec    = data.duration;
    const boxesAcross = totalSec / 0.04;
    const plotWidth   = boxesAcross * SMALL_BOX;

    // Voltage range ±1.5 mV → 30 small boxes
    const plotHeight = 30 * SMALL_BOX;

    // Set canvas internal resolution
    canvas.width  = MARGIN_LEFT + plotWidth + MARGIN_RIGHT;
    canvas.height = MARGIN_TOP  + plotHeight + MARGIN_BOTTOM;

    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(MARGIN_LEFT, MARGIN_TOP, plotWidth, plotHeight);

    // Grid
    this.drawGrid(ctx, plotWidth, plotHeight, MARGIN_LEFT, MARGIN_TOP, SMALL_BOX, LARGE_BOX);

    // Axes
    this.drawAxes(ctx, plotWidth, plotHeight, MARGIN_LEFT, MARGIN_TOP, SMALL_BOX, MARGIN_BOTTOM);

    // ECG trace
    const signal     = data.signals[this.currentLead];
    const timeVector = data.time;
    const minV       = -1.5, maxV = +1.5;
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 1.5;

    for (let i = 0; i < signal.length; i++) {
      const x = MARGIN_LEFT + (timeVector[i] / totalSec) * plotWidth;
      const y = MARGIN_TOP + plotHeight - ((signal[i] - minV) / (maxV - minV)) * plotHeight;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Show canvas
    canvas.style.display = 'block';
  }

  // drawAxes with updated bottom margin for axis labels
  drawAxes(ctx, width, height, offsetX, offsetY, small, bottomMargin) {
    ctx.save();
    ctx.translate(offsetX, offsetY);

    ctx.fillStyle   = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 1.5;
    ctx.font        = '12px Arial';

    // X-axis ticks
    const stepBoxes = 5, stepSec = 0.2;
    const stepPx    = small * stepBoxes;
    for (let x = 0; x <= width; x += stepPx) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, height + 6);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText((x / stepPx * stepSec).toFixed(1) + ' s', x, height + bottomMargin - 10);
    }

    // Y-axis ticks
    const stepYPx = small * 5, stepVolt = 0.5;
    ctx.textAlign = 'right';
    const labelX = -8;
    const rows   = Math.floor(height / stepYPx) + 1;
    for (let j = 0; j < rows; j++) {
      const y = height - j * stepYPx;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(-6, y);
      ctx.stroke();
      const volt = (j * stepVolt) - ((rows - 1) * stepVolt / 2);
      ctx.fillText(volt.toFixed(1) + ' mV', labelX, y + 4);
    }

    // Axis titles
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', width / 2, height + bottomMargin / 2 + 10);
    ctx.save();
    ctx.translate(-50, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Voltage (mV)', 0, 0);
    ctx.restore();

    ctx.restore();
  }

// === drawGrid: small & large ECG boxes ===

drawGrid(ctx, width, height, offsetX, offsetY, small, large) {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Small boxes
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= width; x += small) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += small) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Large boxes
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth   = 1;
  for (let x = 0; x <= width; x += large) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += large) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

// === drawAxes: time & voltage labels ===



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
