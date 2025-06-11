/**
 * Part 1: Initialization, File Handling, Server IO, and Result Injection
 */

// Global variables for ECG chart
let ecgChart = null;
let currentECGData = null;
let currentLead = 0; // Default to the first lead

// ECG Lead names mapping
const ECG_LEADS = [
  'Lead I','Lead II','Lead III','aVR','aVL','aVF',
  'V1','V2','V3','V4','V5','V6'
];

/**
 * Initialize ECG analysis functionality
 */
function initializeECGAnalysis() {
  const matFileInput = document.getElementById('ecg_mat_file');
  const heaFileInput = document.getElementById('ecg_hea_file');

  // Setup the protection mechanism on /edit
  const trySetupProtection = () => {
    if (typeof setupECGSectionProtection === 'function') {
      setupECGSectionProtection();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trySetupProtection);
  } else {
    setTimeout(trySetupProtection, 0);
  }

  if (matFileInput && heaFileInput) {
    matFileInput.addEventListener('change', () => {
      if (typeof protectECGSectionVisibility === 'function') protectECGSectionVisibility();
      checkAndAnalyzeECG();
    });
    heaFileInput.addEventListener('change', () => {
      if (typeof protectECGSectionVisibility === 'function') protectECGSectionVisibility();
      checkAndAnalyzeECG();
    });
    console.log('ECG analysis event listeners attached.');
  } else {
    console.warn('ECG file inputs not found');
  }

  // Start in “no files” state
  setECGState('instruction');
}

/**
 * Templates and state-setter for the three UI cards
 */
const ECG_TEMPLATES = {
  instruction: `
    <div class="alert alert-info ecg-analysis-card">
      <h6><i class="fas fa-info-circle"></i> ECG Analysis Ready</h6>
      <p>Upload BOTH MAT and HEA files above to get real-time results here.</p>
    </div>`,
  waiting: `
    <div class="alert alert-warning ecg-analysis-card">
      <h6><i class="fas fa-clock"></i> Waiting for Both ECG Files</h6>
      <p>Please select both MAT and HEA files to perform ECG analysis.</p>
    </div>`,
  results: `
    <div class="ecg-analysis-card">
      <div class="row mb-2">
        <div class="col-md-6">
          <h6>Primary Diagnosis:</h6>
          <div id="primary-diagnosis" class="font-weight-bold text-primary"></div>
        </div>
        <div class="col-md-6">
          <h6>Confidence:</h6>
          <div id="confidence-level" class="font-weight-bold"></div>
        </div>
      </div>
      <h6>Detailed Probabilities:</h6>
      <div id="detailed-probabilities"></div>
    </div>`
};

function setECGState(stateKey) {
  const resultsEl = document.getElementById('ecg-analysis-results');
  const spinner   = document.getElementById('ecg-analysis-loading');
  const errorEl   = document.getElementById('ecg-analysis-error');
  const section   = document.getElementById('ecg-analysis-section');
  if (!resultsEl || !section) return;

  resultsEl.innerHTML = ECG_TEMPLATES[stateKey] || '';
  section.style.display    = 'block';
  section.style.visibility = 'visible';

  if (spinner) spinner.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
}

function displayECGError(msg) {
  const errorEl = document.getElementById('ecg-analysis-error');
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

/**
 * Handle file selection state & kick off analysis
 */
function checkAndAnalyzeECG() {
  const matFile = document.getElementById('ecg_mat_file').files[0];
  const heaFile = document.getElementById('ecg_hea_file').files[0];
  console.log('ECG files check – MAT:', !!matFile, 'HEA:', !!heaFile);

  if (matFile && heaFile) {
    setECGState('results');
    analyzeECGFiles(matFile, heaFile);
  } else if (matFile || heaFile) {
    setECGState('waiting');
  } else {
    setECGState('instruction');
  }
}

/**
 * POST the MAT+HEA files, toggle spinner, then route to results or error
 */
function analyzeECGFiles(matFile, heaFile) {
  console.log('Sending ECG files for analysis…');
  const spinner = document.getElementById('ecg-analysis-loading');
  if (spinner) spinner.style.display = 'block';

  const fd = new FormData();
  fd.append('mat_file', matFile);
  fd.append('hea_file', heaFile);

  fetch('/analyze_ecg', { method: 'POST', body: fd })
    .then(r => {
      if (!r.ok) throw new Error(`Server returned ${r.status}`);
      return r.json();
    })
    .then(data => {
      if (spinner) spinner.style.display = 'none';
      if (data.success) {
        displayECGResults(data);
      } else {
        displayECGError(data.error || 'Analysis failed');
      }
    })
    .catch(err => {
      console.error('ECG analysis error:', err);
      if (spinner) spinner.style.display = 'none';
      displayECGError('Network error: ' + err.message);
    });
}

/**
 * Populate the placeholders created by setECGState('results')
 */
function displayECGResults(data) {
  console.log('Displaying ECG results:', data);
  const pdEl = document.getElementById('primary-diagnosis');
  const cfEl = document.getElementById('confidence-level');
  const dpEl = document.getElementById('detailed-probabilities');

  if (pdEl) pdEl.textContent = data.primary_diagnosis.name;
  if (cfEl) {
    const pct = (data.primary_diagnosis.probability * 100).toFixed(1) + '%';
    cfEl.textContent = pct;
    cfEl.className = 'font-weight-bold ' +
      (data.primary_diagnosis.probability > 0.7 ? 'text-success' :
       data.primary_diagnosis.probability > 0.5 ? 'text-warning' :
       'text-danger');
  }
  if (dpEl) {
    let html = '<div class="row">';
    for (const [abbr, p] of Object.entries(data.probabilities)) {
      const pp = (p * 100).toFixed(1);
      html += `
        <div class="col-md-6 mb-2">
          <small><strong>${abbr}:</strong> ${pp}%</small>
          <div class="progress" style="height:5px;">
            <div class="progress-bar" role="progressbar" style="width:${pp}%"></div>
          </div>
        </div>`;
    }
    dpEl.innerHTML = html + '</div>';
  }

  if (data.ecg && data.ecg.time && data.ecg.signals) {
    displayECGWaveform(data.ecg);
  } else {
    showWaveformError('ECG waveform data not available');
  }
}

// Exports & global bindings
window.ECGOperations = {
  initializeECGAnalysis,
  checkAndAnalyzeECG,
  analyzeECGFiles,
  displayECGResults,
  displayECGWaveform
};
window.checkAndAnalyzeECG = checkAndAnalyzeECG;
window.addEventListener('DOMContentLoaded', initializeECGAnalysis);
