'use strict';

// Extend the base upload/analysis handler
class ECGEditFormHandler extends ECGFormSubmissionHandler {
  constructor(formId = 'edit-visit-form', visitId, hasExistingECG) {
    super(formId, true); // isEditMode = true
    this.visitId = visitId;
    this.hasExistingECG = Boolean(hasExistingECG); // Ensure it's a boolean

    console.log(`ECGEditFormHandler Constructor: visitId=${this.visitId}, hasExistingECG=${this.hasExistingECG}`);
  }

  // Override initializeElements to add edit-specific behavior
  // and to correctly identify the SVG container.
  initializeElements() {
    console.log('ECGEditFormHandler: Custom initializeElements running.');
    this.ecgWaveformSVGContainer = document.getElementById('ecg-waveform-svg-container');
    if (!this.ecgWaveformSVGContainer) {
      console.error('ECGEditFormHandler: ecg-waveform-svg-container not found!');
    }

    // Explicitly clear/reset relevant UI areas for edit mode before attempting to load data
    if (this.analysisResultsDiv) this.analysisResultsDiv.innerHTML = '';
    if (this.analysisErrorDiv) this.analysisErrorDiv.textContent = '';
    if (this.waveformErrorDiv) this.waveformErrorDiv.textContent = '';
    if (this.waveformControlsDiv) this.waveformControlsDiv.innerHTML = '';
    if (this.ecgWaveformSVGContainer) this.ecgWaveformSVGContainer.innerHTML = ''; // Clear SVG container too


    if (this.visitId && this.hasExistingECG) {
      console.log(`ECGEditFormHandler: Visit ID ${this.visitId} has existing ECG (hasExistingECG: ${this.hasExistingECG}). Fetching data.`);
      this.showAnalysisLoading(); 
      this.showWaveformLoading(); 
      this.fetchAnalysisAndWaveform(this.visitId);
    } else {
      console.log(`ECGEditFormHandler: No Visit ID, or no existing ECG (hasExistingECG: ${this.hasExistingECG}). Not auto-loading.`);
      if (this.analysisResultsDiv) {
        this.analysisResultsDiv.innerHTML = '<p>No existing ECG data found for this visit. Upload new .mat and .hea files if needed.</p>';
      }
      // Waveform area might also need a message if no data is loaded
      if (this.waveformErrorDiv) {
         this.waveformErrorDiv.innerHTML = '<p>No existing ECG waveform to display. Upload files to view waveform.</p>';
      }
      this.hideAnalysisLoading(); // Ensure loading indicators are hidden
      this.hideWaveformLoading();
    }
  }

  // Override showWaveformLoading to ensure SVG container is also handled
  showWaveformLoading() {
    super.showWaveformLoading(); // Call base method if it exists and is useful
    if (this.ecgWaveformSVGContainer) this.ecgWaveformSVGContainer.innerHTML = ''; // Clear previous plot
    if (this.waveformControlsDiv) this.waveformControlsDiv.innerHTML = ''; // Clear controls
    console.log("ECGEditFormHandler: Show waveform loading (SVG).");
  }

  // Override hideWaveformLoading
  hideWaveformLoading() {
    super.hideWaveformLoading();
    console.log("ECGEditFormHandler: Hide waveform loading (SVG).");
  }

  // Override showWaveformError to ensure SVG container is cleared
  showWaveformError(message) {
    super.showWaveformError(message);
    if (this.ecgWaveformSVGContainer) this.ecgWaveformSVGContainer.innerHTML = '';
    if (this.waveformControlsDiv) this.waveformControlsDiv.innerHTML = '';
    console.log("ECGEditFormHandler: Show waveform error (SVG).");
  }

  async fetchAnalysisAndWaveform(visitId) {
    console.log(`ECGEditFormHandler: fetchAnalysisAndWaveform called for visitId ${visitId}`);
    if (!visitId) {
      console.error("ECGEditFormHandler: fetchAnalysisAndWaveform - visitId is undefined.");
      this.showAnalysisError("Cannot load ECG data: Visit ID is missing.");
      this.showWaveformError("Cannot load waveform: Visit ID is missing.");
      return;
    }

    this.showAnalysisLoading();
    this.showWaveformLoading();
    // STEP A: Analyze by visit
    fetch(`/analyze_ecg_by_visit/${visitId}`)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.error || `Analysis server error: ${response.status}`);
          }).catch(() => {
            throw new Error(`Analysis server error: ${response.status} (non-JSON response)`);
          });
        }
        return response.json();
      })
      .then(data => {
        this.hideLoading(); // Hide analysis loading
        if (!data.success) {
          throw new Error(data.error || 'Analysis failed');
        }
        console.log("ECGEditFormHandler: Analysis data received:", data);
        this.displayAnalysisResults(data);
        // STEP B: Now get waveform data
        return fetch(`/ecg_waveform_by_visit/${visitId}`);
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.error || `Waveform server error: ${response.status}`);
          }).catch(() => {
            throw new Error(`Waveform server error: ${response.status} (non-JSON response)`);
          });
        }
        return response.json();
      })
      .then(wf => {
        this.hideWaveformLoading(); // Hide waveform loading
        if (!wf.success || !wf.ecg_data) {
          throw new Error(wf.error || 'Waveform data load failed or data missing');
        }
        console.log("ECGEditFormHandler: Waveform data received:", wf);
        this.currentECGData = wf.ecg_data;
        this.currentLead = 0;
        this.createLeadControls(
          this.currentECGData.n_leads, // Ensure this matches the property from your API
          this.currentECGData.lead_names
        );
        this.displayECGWaveform(); // This will now use the SVG container
        if (this.waveformDisplayArea) this.waveformDisplayArea.style.display = 'block';
      })
      .catch(err => {
        console.error('ECGEditFormHandler: Edit ECG auto-load error:', err);
        this.hideLoading();
        this.hideWaveformLoading();
        this.displayError(`Failed to load existing ECG: ${err.message}`);
        this.showWaveformError(`Failed to load waveform: ${err.message}`);
      });
  }

  // Override displayECGWaveform to ensure it uses the correct container for SVG
  displayECGWaveform(waveformUrl) { // Ensure this uses SVG container
    console.log(`ECGEditFormHandler: displayECGWaveform called with URL: ${waveformUrl}`);
    if (!this.ecgWaveformSVGContainer) {
      console.error("ECGEditFormHandler: SVG container (ecg-waveform-svg-container) not found for waveform display.");
      this.showWaveformError("Waveform display area not found.");
      return;
    }

    // Clear previous SVG content from the specific plot container
    this.ecgWaveformSVGContainer.innerHTML = '';
    if (this.waveformDisplayArea) this.waveformDisplayArea.style.display = 'block';
    if (this.waveformError) this.waveformError.style.display = 'none'; // Clear previous errors

    // --- SVG Plotting logic (copied and adapted from ECGFormSubmissionHandler) ---
    // This assumes the SVG plotting logic from ECGFormSubmissionHandler.displayECGWaveform
    // is suitable. If it needs specific adaptations for the edit form, they would go here.

    const data = this.currentECGData;
    const PX_PER_MM = 4;
    const SMALL_BOX = PX_PER_MM;
    const LARGE_BOX = PX_PER_MM * 5;
    const M_LEFT = LARGE_BOX * 4;
    const M_RIGHT = LARGE_BOX * 1.5;
    const M_TOP = LARGE_BOX * 1.5;
    const M_BOTTOM = LARGE_BOX * 3;

    const totalSec = data.duration;
    const boxesHorz = totalSec / 0.04;
    const plotW = boxesHorz * SMALL_BOX;
    const plotH = 30 * SMALL_BOX; // Standard ±1.5mV = 30mm height

    const svgW = M_LEFT + plotW + M_RIGHT;
    const svgH = M_TOP + plotH + M_BOTTOM;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', svgW);
    svg.setAttribute('height', svgH);
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.style.maxWidth = '100%'; // Make it responsive
    svg.style.height = 'auto';

    // 1) Background
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('x', M_LEFT);
    bg.setAttribute('y', M_TOP);
    bg.setAttribute('width', plotW);
    bg.setAttribute('height', plotH);
    bg.setAttribute('fill', '#FFF8DC'); // Light yellow, common for ECG paper
    svg.appendChild(bg);

    // 2) Grid (small & large)
    // Small lines (every 1mm = 0.04s, 0.1mV)
    for (let i = 0; i <= plotW / SMALL_BOX; i++) {
      const x = M_LEFT + i * SMALL_BOX;
      const lineV = document.createElementNS(NS, 'line');
      lineV.setAttribute('x1', x); lineV.setAttribute('y1', M_TOP);
      lineV.setAttribute('x2', x); lineV.setAttribute('y2', M_TOP + plotH);
      lineV.setAttribute('stroke', 'rgba(255,0,0,0.2)'); // Faint red
      lineV.setAttribute('stroke-width', '0.5');
      svg.appendChild(lineV);
    }
    for (let i = 0; i <= plotH / SMALL_BOX; i++) {
      const y = M_TOP + i * SMALL_BOX;
      const lineH = document.createElementNS(NS, 'line');
      lineH.setAttribute('x1', M_LEFT); lineH.setAttribute('y1', y);
      lineH.setAttribute('x2', M_LEFT + plotW); lineH.setAttribute('y2', y);
      lineH.setAttribute('stroke', 'rgba(255,0,0,0.2)'); // Faint red
      lineH.setAttribute('stroke-width', '0.5');
      svg.appendChild(lineH);
    }

    // Large lines (every 5mm = 0.2s, 0.5mV)
    for (let i = 0; i <= plotW / LARGE_BOX; i++) {
      const x = M_LEFT + i * LARGE_BOX;
      const lineV = document.createElementNS(NS, 'line');
      lineV.setAttribute('x1', x); lineV.setAttribute('y1', M_TOP);
      lineV.setAttribute('x2', x); lineV.setAttribute('y2', M_TOP + plotH);
      lineV.setAttribute('stroke', 'rgba(255,0,0,0.4)'); // Darker red
      lineV.setAttribute('stroke-width', '1');
      svg.appendChild(lineV);
    }
     for (let i = 0; i <= plotH / LARGE_BOX; i++) {
      const y = M_TOP + i * LARGE_BOX;
      const lineH = document.createElementNS(NS, 'line');
      lineH.setAttribute('x1', M_LEFT); lineH.setAttribute('y1', y);
      lineH.setAttribute('x2', M_LEFT + plotW); lineH.setAttribute('y2', y);
      lineH.setAttribute('stroke', 'rgba(255,0,0,0.4)'); // Darker red
      lineH.setAttribute('stroke-width', '1');
      svg.appendChild(lineH);
    }

    // 3) ECG trace
    if (data.signals && data.signals[this.currentLead] && data.time) {
        const signalData = data.signals[this.currentLead];
        const timeData = data.time;
        // Standard ECG: 1mV = 10mm. If plotH is 30mm (±1.5mV), then 1mV = plotH / 3.
        // Y = M_TOP + plotH/2 (centerline) - (signal_in_mV * (plotH/3) )
        // Assuming signal is in mV. If it's raw ADC, conversion is needed.
        // For now, let's assume it's normalized to a range that fits well, or direct mV.
        // If data.signals are in mV, and 0mV is the center of the y-axis for the plot:
        // Max amplitude displayed is 1.5mV. So, y_center = M_TOP + plotH / 2.
        // y_value = y_center - (signal_value_mV * (plotH / 3));

        let points = '';
        for (let i = 0; i < timeData.length; i++) {
            const x = M_LEFT + (timeData[i] / totalSec) * plotW;
            // Centering the waveform: plotH corresponds to 3mV range (-1.5mV to +1.5mV)
            // So, 0mV is at M_TOP + plotH / 2.
            // A signal value of `s` mV should be plotted at `(plotH / 2 - s * (plotH / 3))` from M_TOP.
            // Or, `M_TOP + plotH/2 - s * (10 * PX_PER_MM) / (1 * PX_PER_MM) = M_TOP + plotH/2 - s * 10` (if 1mV = 10mm)
            // Let's use the existing scaling: (value + 1.5)/3 * plotH, assuming signal is -1.5 to 1.5 mV
            const y = M_TOP + plotH - ((signalData[i] + 1.5) / 3.0) * plotH;
            points += `${x},${y} `;
        }

        const trace = document.createElementNS(NS, 'polyline');
        trace.setAttribute('points', points.trim());
        trace.setAttribute('fill', 'none');
        trace.setAttribute('stroke', 'black'); // Or 'orange' as preferred
        trace.setAttribute('stroke-width', '1.5');
        svg.appendChild(trace);
    } else {
        console.warn("ECGEditFormHandler: Signal data for current lead or time data is missing.");
        this.showWaveformError('Waveform data for the selected lead is incomplete.');
    }

    // 4) X-axis ticks & labels (time - e.g., every 0.2s)
    const timeTickInterval = 0.2; // seconds
    const numTimeTicks = Math.floor(totalSec / timeTickInterval);
    for (let i = 0; i <= numTimeTicks; i++) {
        const t = i * timeTickInterval;
        const x = M_LEFT + (t / totalSec) * plotW;
        const tick = document.createElementNS(NS, 'line');
        tick.setAttribute('x1', x); tick.setAttribute('y1', M_TOP + plotH);
        tick.setAttribute('x2', x); tick.setAttribute('y2', M_TOP + plotH + 5);
        tick.setAttribute('stroke', 'black'); tick.setAttribute('stroke-width', '1');
        svg.appendChild(tick);

        if (i % 1 === 0) { // Label every major tick (or adjust as needed)
            const text = document.createElementNS(NS, 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', M_TOP + plotH + 15);
            text.setAttribute('font-size', '10');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = t.toFixed(1);
            svg.appendChild(text);
        }
    }

    // 5) Y-axis ticks & labels (voltage - e.g., every 0.5mV)
    const voltageTickInterval = 0.5; // mV
    const numVoltageTicks = Math.floor(1.5 / voltageTickInterval) * 2; // For ±1.5mV range
    for (let i = 0; i <= numVoltageTicks; i++) {
        const v = -1.5 + i * voltageTickInterval;
        const y = M_TOP + plotH - ((v + 1.5) / 3.0) * plotH;
        const tick = document.createElementNS(NS, 'line');
        tick.setAttribute('x1', M_LEFT - 5); tick.setAttribute('y1', y);
        tick.setAttribute('x2', M_LEFT);     tick.setAttribute('y2', y);
        tick.setAttribute('stroke', 'black'); tick.setAttribute('stroke-width', '1');
        svg.appendChild(tick);

        if (Math.abs(v % 0.5) < 0.01 || i === 0 || i === numVoltageTicks) { // Label every 0.5mV
            const text = document.createElementNS(NS, 'text');
            text.setAttribute('x', M_LEFT - 8);
            text.setAttribute('y', y + 3); // Adjust for text alignment
            text.setAttribute('font-size', '10');
            text.setAttribute('text-anchor', 'end');
            text.textContent = v.toFixed(1);
            svg.appendChild(text);
        }
    }
    
    // 6) Axis titles
    const xlabel = document.createElementNS(NS, 'text');
    xlabel.setAttribute('x', M_LEFT + plotW / 2);
    xlabel.setAttribute('y', M_TOP + plotH + 30);
    xlabel.setAttribute('font-size', '12');
    xlabel.setAttribute('text-anchor', 'middle');
    xlabel.textContent = 'Time (s)';
    svg.appendChild(xlabel);

    const ylabel = document.createElementNS(NS, 'text');
    const ylabelX = M_LEFT - 40;
    const ylabelY = M_TOP + plotH / 2;
    ylabel.setAttribute('x', ylabelX);
    ylabel.setAttribute('y', ylabelY);
    ylabel.setAttribute('font-size', '12');
    ylabel.setAttribute('text-anchor', 'middle');
    ylabel.setAttribute('transform', `rotate(-90 ${ylabelX} ${ylabelY})`);
    ylabel.textContent = 'Voltage (mV)';
    svg.appendChild(ylabel);

    // Append the generated SVG to the container
    this.ecgWaveformSVGContainer.appendChild(svg);
    console.log("ECGEditFormHandler: SVG waveform displayed in ecg-waveform-svg-container.");
  }
  
  // Ensure show/hide waveform methods also consider the SVG container if needed,
  // though clearing its innerHTML is the primary way to "hide" the plot.
  showWaveformLoading() {
    super.showWaveformLoading(); // Call base method
    if (this.ecgWaveformSVGContainer) this.ecgWaveformSVGContainer.innerHTML = ''; // Clear plot during load
    console.log("ECGEditFormHandler: showWaveformLoading");
  }

  hideWaveformLoading() {
    super.hideWaveformLoading();
    console.log("ECGEditFormHandler: hideWaveformLoading");
  }

  showWaveformError(msg) {
    super.showWaveformError(msg);
    if (this.ecgWaveformSVGContainer) this.ecgWaveformSVGContainer.innerHTML = ''; // Clear plot on error
    console.log("ECGEditFormHandler: showWaveformError - ", msg);
  }

  hideWaveformDisplay() {
    super.hideWaveformDisplay();
    if (this.ecgWaveformSVGContainer) this.ecgWaveformSVGContainer.innerHTML = ''; // Clear plot when hiding display area
    console.log("ECGEditFormHandler: hideWaveformDisplay");
  }

}

// Override the global handler class to use our edit subclass
// This ensures that any code trying to access window.ECGFormSubmissionHandler
// on the edit page gets the specialized version.
window.ECGFormSubmissionHandler = ECGEditFormHandler;
