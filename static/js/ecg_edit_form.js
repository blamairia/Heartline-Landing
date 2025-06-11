/**
 * ECG Edit Form Handler
 * Handles ECG functionality for EXISTING visit edit forms
 * This script shows existing ECG data and allows updates using new file uploads
 */

class ECGEditFormHandler {
    constructor() {
        this.matFileInput = null;
        this.heaFileInput = null;
        this.analysisSection = null;
        this.analysisResults = null;
        this.analysisLoading = null;
        this.analysisError = null;
        
        this.visitId = null;
        this.hasExistingECG = false;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeElements());
        } else {
            this.initializeElements();
        }
    }
    
    initializeElements() {
        // Extract visit ID from URL
        this.extractVisitId();
        
        // Get DOM elements - using form field names from Flask-WTF
        this.matFileInput = document.querySelector('input[name="ecg_mat"]');
        this.heaFileInput = document.querySelector('input[name="ecg_hea"]');
        this.analysisSection = document.getElementById('ecg-analysis-section');
        
        if (!this.analysisSection) {
            console.warn('ECG Edit Form: Analysis section not found');
            return;
        }
        
        // Get analysis result elements
        this.analysisResults = document.getElementById('ecg-analysis-results');
        this.analysisLoading = document.getElementById('ecg-analysis-loading');
        this.analysisError = document.getElementById('ecg-analysis-error');
        
        // Check if there are existing ECG files
        this.checkExistingECGFiles();
        
        // Attach event listeners for new file uploads
        if (this.matFileInput && this.heaFileInput) {
            this.attachEventListeners();
        }
        
        console.log('ECG Edit Form handler initialized for visit:', this.visitId);
    }
    
    extractVisitId() {
        // Extract visit ID from URL path like /visit/123/edit
        const pathParts = window.location.pathname.split('/');
        const visitIndex = pathParts.indexOf('visit');
        if (visitIndex !== -1 && pathParts[visitIndex + 1]) {
            this.visitId = parseInt(pathParts[visitIndex + 1]);
        }
    }
    
    checkExistingECGFiles() {
        // Check if there's a current-file-info div which indicates existing ECG files
        const existingFileInfo = document.querySelector('.current-file-info');
        if (existingFileInfo) {
            this.hasExistingECG = true;
            // Show analysis section to indicate ECG data is available
            this.showAnalysisSection();
            // Show message about existing analysis
            this.showExistingECGMessage();
        }
    }
    
    showExistingECGMessage() {
        if (this.analysisResults) {
            this.analysisResults.innerHTML = `
                <div class="alert alert-info">
                    <h6><i class="fas fa-info-circle"></i> ECG Files Available</h6>
                    <p>This visit has existing ECG files. The analysis results are stored in the database.</p>                    <p><strong>Upload new ECG files below to perform a new analysis.</strong></p>
                </div>
            `;
            // Results section is always visible - no need to show/hide
        }
    }
    
    attachEventListeners() {
        // Listen for file changes on new uploads
        if (this.matFileInput) {
            this.matFileInput.addEventListener('change', () => this.checkAndAnalyzeECG());
        }
        if (this.heaFileInput) {
            this.heaFileInput.addEventListener('change', () => this.checkAndAnalyzeECG());
        }
    }
    
    checkAndAnalyzeECG() {
        const matFile = this.matFileInput ? this.matFileInput.files[0] : null;
        const heaFile = this.heaFileInput ? this.heaFileInput.files[0] : null;
        
        console.log('ECG files check - MAT:', !!matFile, 'HEA:', !!heaFile);
          // Show analysis section when any file is selected
        if (matFile || heaFile) {
            this.showAnalysisSection();
        }
        
        // If both files are present, start analysis
        if (matFile && heaFile) {
            console.log('Both ECG files present, starting analysis...');
            this.analyzeECGFiles(matFile, heaFile);
        } else if (matFile || heaFile) {
            // Only one file selected - show waiting message
            this.showWaitingForBothFiles();
        } else if (!this.hasExistingECG) {
            // No files and no existing data - show instruction message
            this.showInstructionMessage();
        }
    }
      showAnalysisSection() {
        // Analysis section is always visible - no need to show/hide
        console.log('Analysis section is always visible');
    }
    
    hideResults() {
        // Don't hide results section - keep it always visible
        // Only hide error messages when not needed
        if (this.analysisError) {
            this.analysisError.style.display = 'none';
        }
    }
    
    showWaitingForBothFiles() {
        if (this.analysisResults) {
            this.analysisResults.innerHTML = `
                <div class="alert alert-warning">
                    <h6><i class="fas fa-clock"></i> Waiting for Both ECG Files</h6>
                    <p>Please select both MAT and HEA files to perform ECG analysis.</p>                </div>
            `;            // Results section is always visible - no need to show/hide
        }
        if (this.analysisError) {
            this.analysisError.style.display = 'none';
        }
    }
    
    showInstructionMessage() {
        if (this.analysisResults) {
            this.analysisResults.innerHTML = `
                <div class="alert alert-info">
                    <h6><i class="fas fa-info-circle"></i> ECG Analysis Available</h6>
                    <p>Upload new ECG files (MAT and HEA format) above to perform fresh analysis.</p>
                    <small class="text-muted">Both files are required for complete analysis.</small>
                </div>
            `;
        }
        if (this.analysisError) {
            this.analysisError.style.display = 'none';
        }
    }
    
    showLoading() {
        if (this.analysisLoading) {
            this.analysisLoading.style.display = 'block';
        }
        this.hideResults();
    }
    
    hideLoading() {
        if (this.analysisLoading) {
            this.analysisLoading.style.display = 'none';
        }
    }
    
    analyzeECGFiles(matFile, heaFile) {
        console.log('Sending ECG files for analysis...');
        
        this.showLoading();
        
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
            this.hideLoading();
            if (data.success) {
                this.displayAnalysisResults(data);
            } else {
                this.showError(data.error || 'Analysis failed');
            }
        })
        .catch(error => {
            console.error('ECG analysis network error:', error);
            this.hideLoading();
            this.showError('Network error: ' + error.message);
        });
    }
    
    displayAnalysisResults(data) {
        if (!this.analysisResults) return;
        
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
        this.displayDetailedProbabilities(data.probabilities);
        
        // Results section is always visible - no need to show/hide
        console.log('ECG analysis results displayed successfully');
    }
    
    displayDetailedProbabilities(probabilities) {
        const detailedProbs = document.getElementById('detailed-probabilities');
        if (!detailedProbs) return;
        
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
        for (const [abbr, probability] of Object.entries(probabilities)) {
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
    
    showError(message) {
        if (this.analysisError) {
            this.analysisError.textContent = message;
            this.analysisError.style.display = 'block';
        }
    }
}

// Initialize the ECG edit form handler
window.ECGEditFormHandler = ECGEditFormHandler;

// Auto-initialize when script loads
let ecgEditFormHandler = null;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ecgEditFormHandler = new ECGEditFormHandler();
    });
} else {
    ecgEditFormHandler = new ECGEditFormHandler();
}
