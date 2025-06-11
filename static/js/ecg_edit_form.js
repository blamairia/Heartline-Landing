'use strict';

// Extend the base upload/analysis handler
class ECGEditFormHandler extends ECGFormSubmissionHandler {
  initializeElements() {
    // 1) Run the base init so we wire up spinners, analysisSection, file‐change listeners, etc.
    super.initializeElements();

    // 2) Look for our edit‐mode metadata div
    const meta = document.getElementById('ecg-edit-meta');
    if (!meta) return;

    const visitId  = meta.dataset.visitId;
    const hasMat   = !!meta.dataset.ecgMatUrl;
    const hasHea   = !!meta.dataset.ecgHeaUrl;

    // Only auto‐load if both files were previously uploaded
    if (visitId && hasMat && hasHea) {
      // Show the analysis panel immediately
      this.showAnalysisSection();

      // STEP A: Analyze by visit
      fetch(`/analyze_ecg_by_visit/${visitId}`)
        .then(r => r.json())
        .then(data => {
          if (!data.success) {
            throw new Error(data.error || 'Analysis failed');
          }
          // Render the diagnosis & probabilities
          this.displayAnalysisResults(data);
          // STEP B: Now get waveform data
          return fetch(`/ecg_waveform_by_visit/${visitId}`);
        })
        .then(r => r.json())
        .then(wf => {
          if (!wf.success) {
            throw new Error(wf.error || 'Waveform load failed');
          }
          // Store and draw
          this.currentECGData = wf.ecg_data;
          this.currentLead   = 0;
          this.createLeadControls(
            wf.ecg_data.leads,
            wf.ecg_data.lead_names
          );
          this.displayECGWaveform();
        })
        .catch(err => {
          console.error('Edit ECG load error:', err);
          this.displayError(err.message);
        });
    }
  }
}

// Override the global handler class to use our edit subclass
window.ECGFormSubmissionHandler = ECGEditFormHandler;

// Initialize exactly once
window.addEventListener('DOMContentLoaded', () => {
  // If someone else set window.ecgFormHandler, overwrite it cleanly
  window.ecgFormHandler = new ECGEditFormHandler();
});
