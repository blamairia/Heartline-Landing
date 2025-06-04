/**
 * Visit Form JavaScript
 * Handles dynamic prescription/document forms and ECG real-time analysis
 */

// Global counters for dynamic forms
let prescriptionCounter = 0;
let documentCounter = 0;

/**
 * Initialize the visit form when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    initializeECGAnalysis();
});

/**
 * Initialize form counters and event listeners
 */
function initializeForm() {
    // Count existing prescriptions and documents
    prescriptionCounter = document.querySelectorAll('.prescription-row').length;
    documentCounter = document.querySelectorAll('.document-row').length;
    
    console.log('Form initialized - Prescriptions:', prescriptionCounter, 'Documents:', documentCounter);
}

/**
 * Add a new prescription form row
 */
function addPrescription() {
    const template = document.getElementById('prescription-template');
    if (!template) {
        console.error('Prescription template not found');
        return;
    }
    
    const prescriptionsContainer = document.getElementById('prescriptions-container');
    if (!prescriptionsContainer) {
        console.error('Prescriptions container not found');
        return;
    }
    
    // Clone the template content
    const templateContent = template.content.cloneNode(true);
    
    // Get the HTML and replace placeholders
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(templateContent);
    
    let htmlString = tempDiv.innerHTML.replace(/__prefix__/g, prescriptionCounter);
    
    // Create the new element and add it to the container
    const newElement = document.createElement('div');
    newElement.innerHTML = htmlString;
    prescriptionsContainer.appendChild(newElement.firstElementChild);
    
    prescriptionCounter++;
    console.log('Added prescription row, counter now:', prescriptionCounter);
}

/**
 * Remove a prescription form row
 */
function removePrescription(button) {
    const row = button.closest('.prescription-row');
    if (row) {
        row.remove();
        console.log('Removed prescription row');
    }
}

/**
 * Add a new document form row
 */
function addDocument() {
    const template = document.getElementById('document-template');
    if (!template) {
        console.error('Document template not found');
        return;
    }
    
    const documentsContainer = document.getElementById('documents-container');
    if (!documentsContainer) {
        console.error('Documents container not found');
        return;
    }
    
    // Clone the template content
    const templateContent = template.content.cloneNode(true);
    
    // Get the HTML and replace placeholders
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(templateContent);
    
    let htmlString = tempDiv.innerHTML.replace(/__prefix__/g, documentCounter);
    
    // Create the new element and add it to the container
    const newElement = document.createElement('div');
    newElement.innerHTML = htmlString;
    documentsContainer.appendChild(newElement.firstElementChild);
    
    documentCounter++;
    console.log('Added document row, counter now:', documentCounter);
}

/**
 * Remove a document form row
 */
function removeDocument(button) {
    const row = button.closest('.document-row');
    if (row) {
        row.remove();
        console.log('Removed document row');
    }
}

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
    
    console.log('ECG results displayed successfully');
}

/**
 * Form validation before submission
 */
function validateForm() {
    const patientId = document.getElementById('patient_id').value;
    const visitDate = document.getElementById('visit_date').value;
    
    if (!patientId) {
        alert('Please select a patient');
        return false;
    }
    
    if (!visitDate) {
        alert('Please enter a visit date');
        return false;
    }
    
    return true;
}

// Make functions globally available
window.addPrescription = addPrescription;
window.removePrescription = removePrescription;
window.addDocument = addDocument;
window.removeDocument = removeDocument;
window.validateForm = validateForm;
