/**
 * Visit Form JavaScript
 * Handles dynamic prescription/document forms and ECG real-time analysis
 */

// Global counters for dynamic forms
let prescriptionCounter = 0;
let documentCounter = 0;

/**
 * Debounce utility function to limit API calls
 */
window.debounce = function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Initialize the visit form when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    initializeECGAnalysis();
    initializeMedicamentSearch();
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
 * Initialize medicament search for all existing prescription rows
 */
function initializeMedicamentSearch() {
    const rows = document.querySelectorAll('.prescription-row');
    console.log('Found prescription rows:', rows.length);
    rows.forEach((row, index) => {
        console.log(`Initializing row ${index}:`, row);
        initializeMedSearch(row);
    });
    console.log('Medicament search initialized for existing rows');
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
    const newRow = newElement.firstElementChild;
    prescriptionsContainer.appendChild(newRow);
    
    // Initialize medicament search for the new row
    setTimeout(() => {
        initializeMedSearch(newRow);
        console.log('Initialized medicament search for new prescription row');
    }, 100);
    
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

/**
 * Initialize medicament search functionality for a prescription row
 */
function initializeMedSearch(rowElement) {
    console.log('initializeMedSearch called with row:', rowElement);
    
    const searchBox = rowElement.querySelector('.med-search');
    const optionsList = rowElement.querySelector('.med-options');
    const hiddenInput = rowElement.querySelector('input[type="hidden"][name$="-medicament_num_enr"]');
    
    console.log('Found elements:', { searchBox, optionsList, hiddenInput });
    
    if (!searchBox || !optionsList || !hiddenInput) {
        console.warn('Missing elements for medicament search in row:', rowElement);
        console.log('searchBox:', searchBox);
        console.log('optionsList:', optionsList);
        console.log('hiddenInput:', hiddenInput);
        return;
    }
    
    const index = searchBox.dataset.index;
    let currentPage = 1;
    let isLoading = false;
    
    console.log('Initializing medicament search for index:', index);
    
    // Show dropdown and fetch initial medications when focused
    searchBox.addEventListener('focus', () => {
        console.log('Search box focused');
        currentPage = 1;
        fetchMedications('', index);
        optionsList.style.display = 'block';
    });
    
    // Hide dropdown when blurred (with delay for clicks)
    searchBox.addEventListener('blur', () => {
        setTimeout(() => {
            optionsList.style.display = 'none';
        }, 200);
    });
    
    // Immediate search on input (removed debounce)
    searchBox.addEventListener('input', () => {
        console.log('Search input changed:', searchBox.value);
        const query = searchBox.value.trim();
        currentPage = 1;
        fetchMedications(query, index);
    });
    
    // Add scroll event for pagination
    optionsList.addEventListener('scroll', () => {
        if (optionsList.scrollTop + optionsList.clientHeight >= optionsList.scrollHeight - 5) {
            if (!isLoading) {
                loadMoreMedications();
            }
        }
    });
      /**
     * Fetch medications from server
     */
    function fetchMedications(query, idx, page = 1, append = false) {
        console.log('fetchMedications called with:', { query, idx, page, append });
        
        if (isLoading) {
            console.log('Already loading, skipping request');
            return;
        }
        
        isLoading = true;
        const url = `/search_medicaments?q=${encodeURIComponent(query)}&page=${page}`;
        
        console.log('Making API request to:', url);
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Received medication data:', data);
                
                const meds = data.medicaments || [];
                
                if (!append) {
                    optionsList.innerHTML = '';
                }
                
                if (meds.length === 0 && !append) {
                    const li = document.createElement('li');
                    li.textContent = 'No matches found';
                    li.classList.add('text-muted');
                    li.style.padding = '8px 12px';
                    li.style.fontStyle = 'italic';
                    optionsList.appendChild(li);                } else {
                    meds.forEach(item => {
                        const li = document.createElement('li');
                        li.classList.add('med-option');
                        li.dataset.value = item.id;
                          // Create formatted display with individual fields
                        const nomCom = item.nom_com || 'Unknown';
                        const nomDci = item.nom_dci || '';
                        const dosage = item.dosage || '';
                        const unite = item.unite || '';
                        
                        // Format dosage display
                        let dosageDisplay = dosage;
                        if (dosage && unite && !dosage.includes(unite)) {
                            dosageDisplay = `${dosage} ${unite}`;
                        }
                        
                        li.innerHTML = `
                            <div style="padding: 12px; border-bottom: 1px solid #eee; cursor: pointer;">
                                <div style="font-size: 16px; font-weight: bold; color: #333; line-height: 1.2;">
                                    ${nomCom.toUpperCase()}
                                </div>
                                <div style="font-size: 14px; color: #666; margin-top: 2px;">
                                    ${nomDci}${nomDci && dosageDisplay ? ' - ' : ''}${dosageDisplay}
                                </div>
                            </div>
                        `;
                          li.addEventListener('click', () => {
                            // Create properly formatted display text
                            const nomCom = item.nom_com || 'Unknown';
                            const nomDci = item.nom_dci || '';
                            const dosage = item.dosage || '';
                            const unite = item.unite || '';
                            
                            // Format dosage display
                            let dosageDisplay = dosage;
                            if (dosage && unite && !dosage.includes(unite)) {
                                dosageDisplay = `${dosage} ${unite}`;
                            }
                            
                            // Create display text: "NOM_COM - NOM_DCI - DOSAGE"
                            let displayText = nomCom.toUpperCase();
                            if (nomDci) {
                                displayText += ` - ${nomDci}`;
                            }
                            if (dosageDisplay) {
                                displayText += ` - ${dosageDisplay}`;
                            }
                            
                            searchBox.value = displayText;
                            hiddenInput.value = item.id;
                            optionsList.style.display = 'none';
                            console.log('Selected medication:', item);
                            console.log('Display text:', displayText);
                        });
                        
                        li.addEventListener('mouseenter', () => {
                            li.style.backgroundColor = '#f8f9fa';
                        });
                        
                        li.addEventListener('mouseleave', () => {
                            li.style.backgroundColor = '';
                        });
                        
                        optionsList.appendChild(li);
                    });
                    
                    // Update pagination info
                    const pagination = data.pagination || {};
                    if (!pagination.more) {
                        const noMoreLi = document.createElement('li');
                        noMoreLi.textContent = '--- End of results ---';
                        noMoreLi.classList.add('text-muted');
                        noMoreLi.style.padding = '8px 12px';
                        noMoreLi.style.fontStyle = 'italic';
                        noMoreLi.style.textAlign = 'center';
                        optionsList.appendChild(noMoreLi);
                    }
                }
                
                isLoading = false;
            })
            .catch(error => {
                console.error('Error fetching medications:', error);
                
                if (!append) {
                    optionsList.innerHTML = '';
                    const li = document.createElement('li');
                    li.textContent = 'Error loading medications';
                    li.classList.add('text-danger');
                    li.style.padding = '8px 12px';
                    optionsList.appendChild(li);
                }
                
                isLoading = false;
            });
    }
    
    /**
     * Load more medications (pagination)
     */
    function loadMoreMedications() {
        const query = searchBox.value.trim();
        currentPage++;
        fetchMedications(query, index, currentPage, true);
    }
}

// Make functions globally available
window.addPrescription = addPrescription;
window.removePrescription = removePrescription;
window.addDocument = addDocument;
window.removeDocument = removeDocument;
window.validateForm = validateForm;
