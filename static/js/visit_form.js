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
    initializeMedicamentSearch();
    initializePatientSearch();
    initializePatientModal();
    initializeFormSubmission();
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
 * Initialize form submission with comprehensive logging
 */
function initializeFormSubmission() {
    const form = document.querySelector('form[method="POST"]');
    if (!form) {
        console.error('Visit form not found');
        return;
    }
    
    console.log('Form submission handler initialized');
    
    form.addEventListener('submit', function(e) {
        console.log('=== FORM SUBMISSION STARTED ===');
        
        // Log all form data before validation
        logFormData();
        
        // Validate patient selection specifically
        const isValid = validatePatientSelection();
        
        if (!isValid) {
            console.log('=== FORM SUBMISSION BLOCKED - VALIDATION FAILED ===');
            e.preventDefault();
            return false;
        }
        
        console.log('=== FORM VALIDATION PASSED - SUBMITTING ===');
        // Let the form submit normally
    });
}

/**
 * Comprehensive form data logging for debugging
 */
function logFormData() {
    console.log('--- FORM DATA DIAGNOSIS ---');
    
    // Patient data
    const patientSearchBox = document.getElementById('patient-search');
    const patientHiddenInput = document.getElementById('patient_id');
    
    console.log('Patient Selection:');
    console.log('  Search box value:', patientSearchBox ? patientSearchBox.value : 'NOT FOUND');
    console.log('  Hidden input value:', patientHiddenInput ? patientHiddenInput.value : 'NOT FOUND');
    console.log('  Hidden input name:', patientHiddenInput ? patientHiddenInput.name : 'NOT FOUND');
    console.log('  Hidden input type:', patientHiddenInput ? patientHiddenInput.type : 'NOT FOUND');
    
    // Check if there are any other patient_id fields
    const allPatientFields = document.querySelectorAll('[name*="patient"]');
    console.log('All patient-related fields:');
    allPatientFields.forEach((field, index) => {
        console.log(`  Field ${index}:`, {
            name: field.name,
            value: field.value,
            type: field.type,
            id: field.id,
            required: field.required
        });
    });
    
    // Visit data
    const visitDate = document.getElementById('visit_date');
    console.log('Visit Date:');
    console.log('  Value:', visitDate ? visitDate.value : 'NOT FOUND');
    console.log('  Name:', visitDate ? visitDate.name : 'NOT FOUND');
    
    // Diagnosis
    const diagnosis = document.getElementById('diagnosis');
    console.log('Diagnosis:');
    console.log('  Value:', diagnosis ? diagnosis.value : 'NOT FOUND');
    
    // All form fields with their values
    const formData = new FormData(document.querySelector('form[method="POST"]'));
    console.log('Complete FormData entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
      // Check for any validation errors already present
    const validationErrors = document.querySelectorAll('.invalid-feedback:not(:empty), .text-danger:not(:empty)');
    if (validationErrors.length > 0) {
        console.log('Existing validation errors found:');
        validationErrors.forEach((error, index) => {
            console.log(`  Error ${index}:`, error.textContent.trim());
            console.log(`  Error element:`, error);
            console.log(`  Parent element:`, error.parentElement);
        });
    }
    
    // Check medication selections specifically
    const medicationFields = document.querySelectorAll('[name*="medicament_num_enr"]');
    console.log('Medication fields:');
    medicationFields.forEach((field, index) => {
        console.log(`  Medication ${index}:`, {
            name: field.name,
            value: field.value,
            type: field.type,
            id: field.id
        });
    });
    
    console.log('--- END FORM DATA DIAGNOSIS ---');
}

/**
 * Detailed patient selection validation
 */
function validatePatientSelection() {
    console.log('--- PATIENT VALIDATION ---');
    
    const patientSearchBox = document.getElementById('patient-search');
    const patientHiddenInput = document.getElementById('patient_id');
    
    if (!patientSearchBox) {
        console.error('Patient search box not found!');
        return false;
    }
    
    if (!patientHiddenInput) {
        console.error('Patient hidden input not found!');
        return false;
    }
    
    const searchValue = patientSearchBox.value.trim();
    const hiddenValue = patientHiddenInput.value.trim();
    
    console.log('Patient validation details:');
    console.log('  Search box has value:', searchValue !== '');
    console.log('  Search box value:', `"${searchValue}"`);
    console.log('  Hidden input has value:', hiddenValue !== '');
    console.log('  Hidden input value:', `"${hiddenValue}"`);
    console.log('  Hidden input is numeric:', /^\d+$/.test(hiddenValue));
    
    // Check if patient is selected
    if (!hiddenValue || hiddenValue === '') {
        console.error('VALIDATION FAILED: No patient selected (hidden input is empty)');
        alert('Please select a patient from the dropdown');
        patientSearchBox.focus();
        return false;
    }
    
    // Check if hidden value is numeric (should be patient ID)
    if (!/^\d+$/.test(hiddenValue)) {
        console.error('VALIDATION FAILED: Patient ID is not numeric:', hiddenValue);
        alert('Invalid patient selection. Please select a patient from the dropdown.');
        patientSearchBox.value = '';
        patientHiddenInput.value = '';
        patientSearchBox.focus();
        return false;
    }
    
    // Check if search box has text but no hidden value (incomplete selection)
    if (searchValue && !hiddenValue) {
        console.error('VALIDATION FAILED: Patient name entered but not selected from dropdown');
        alert('Please select a patient from the dropdown list, don\'t just type the name');
        patientSearchBox.focus();
        return false;
    }
    
    console.log('PATIENT VALIDATION PASSED ✓');
    console.log('--- END PATIENT VALIDATION ---');
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
                            
                            console.log('=== MEDICATION SELECTED ===');
                            console.log('Selected medication:', item);
                            console.log('Display text set to search box:', displayText);
                            console.log('Medication ID set to hidden input:', item.id);
                            console.log('Hidden input element:', hiddenInput);
                            console.log('Hidden input name attribute:', hiddenInput.name);
                            console.log('Hidden input value after selection:', hiddenInput.value);
                            console.log('=== END MEDICATION SELECTION ===');
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

/**
 * Initialize patient search functionality
 */
function initializePatientSearch() {
    const searchBox = document.getElementById('patient-search');
    const optionsList = document.getElementById('patient-options');
    const hiddenInput = document.getElementById('patient_id');
    
    if (!searchBox || !optionsList || !hiddenInput) {
        console.warn('Patient search elements not found');
        return;
    }
    
    let currentPage = 1;
    let isLoading = false;
    
    console.log('Initializing patient search');
    
    // Show dropdown and fetch initial patients when focused
    searchBox.addEventListener('focus', () => {
        console.log('Patient search box focused');
        currentPage = 1;
        fetchPatients('');
        optionsList.style.display = 'block';
    });
    
    // Hide dropdown when blurred (with delay for clicks)
    searchBox.addEventListener('blur', () => {
        setTimeout(() => {
            optionsList.style.display = 'none';
        }, 200);
    });
    
    // Search on input with debounce
    searchBox.addEventListener('input', debounce(() => {
        console.log('Patient search input changed:', searchBox.value);
        const query = searchBox.value.trim();
        currentPage = 1;
        fetchPatients(query);
    }, 300));
    
    // Add scroll event for pagination
    optionsList.addEventListener('scroll', () => {
        if (optionsList.scrollTop + optionsList.clientHeight >= optionsList.scrollHeight - 5) {
            if (!isLoading) {
                loadMorePatients();
            }
        }
    });
    
    /**
     * Fetch patients from server
     */
    function fetchPatients(query, page = 1, append = false) {
        console.log('fetchPatients called with:', { query, page, append });
        
        if (isLoading) {
            console.log('Already loading, skipping request');
            return;
        }
        
        isLoading = true;
        const url = `/search_patients?q=${encodeURIComponent(query)}&page=${page}`;
        
        console.log('Making API request to:', url);
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Received patient data:', data);
                
                const patients = data.patients || [];
                
                if (!append) {
                    optionsList.innerHTML = '';
                }
                
                if (patients.length === 0 && !append) {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div style="padding: 12px; text-align: center; color: #666; font-style: italic;">
                            No patients found
                        </div>
                    `;
                    optionsList.appendChild(li);
                } else {
                    patients.forEach(patient => {
                        const li = document.createElement('li');
                        li.classList.add('patient-option');
                        li.dataset.value = patient.id;
                        
                        // Create formatted display
                        const firstName = patient.first_name || '';
                        const lastName = patient.last_name || '';
                        const fullName = `${firstName} ${lastName}`.trim();
                        const phone = patient.phone || '';
                        const email = patient.email || '';
                        
                        let contactInfo = '';
                        if (phone && email) {
                            contactInfo = `${phone} • ${email}`;
                        } else if (phone) {
                            contactInfo = phone;
                        } else if (email) {
                            contactInfo = email;
                        }
                        
                        li.innerHTML = `
                            <div style="padding: 12px; border-bottom: 1px solid #eee; cursor: pointer;">
                                <div style="font-size: 16px; font-weight: bold; color: #333; line-height: 1.2;">
                                    ${fullName || 'Unknown Patient'}
                                </div>
                                ${contactInfo ? `<div style="font-size: 14px; color: #666; margin-top: 2px;">${contactInfo}</div>` : ''}
                            </div>
                        `;
                          li.addEventListener('click', () => {
                            searchBox.value = fullName;
                            hiddenInput.value = patient.id;
                            optionsList.style.display = 'none';
                            
                            console.log('=== PATIENT SELECTED ===');
                            console.log('Selected patient:', patient);
                            console.log('Full name set to search box:', fullName);
                            console.log('Patient ID set to hidden input:', patient.id);
                            console.log('Hidden input element:', hiddenInput);
                            console.log('Hidden input name attribute:', hiddenInput.name);
                            console.log('Hidden input value after selection:', hiddenInput.value);
                            console.log('=== END PATIENT SELECTION ===');
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
                        noMoreLi.innerHTML = `
                            <div style="padding: 8px 12px; text-align: center; color: #999; font-style: italic; font-size: 14px;">
                                --- End of results ---
                            </div>
                        `;
                        optionsList.appendChild(noMoreLi);
                    }
                }
                
                isLoading = false;
            })
            .catch(error => {
                console.error('Error fetching patients:', error);
                
                if (!append) {
                    optionsList.innerHTML = '';
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div style="padding: 12px; text-align: center; color: #dc3545;">
                            Error loading patients
                        </div>
                    `;
                    optionsList.appendChild(li);
                }
                
                isLoading = false;
            });
    }
    
    /**
     * Load more patients (pagination)
     */
    function loadMorePatients() {
        const query = searchBox.value.trim();
        currentPage++;
        fetchPatients(query, currentPage, true);
    }
}

/**
 * Initialize patient creation modal
 */
function initializePatientModal() {
    const addPatientBtn = document.getElementById('add-patient-btn');
    const modal = document.getElementById('addPatientModal');
    const saveBtn = document.getElementById('savePatientBtn');
    const form = document.getElementById('addPatientForm');
    
    if (!addPatientBtn || !modal || !saveBtn || !form) {
        console.warn('Patient modal elements not found');
        return;
    }
    
    console.log('Initializing patient modal');
    
    // Show modal when button is clicked
    addPatientBtn.addEventListener('click', () => {
        // Clear form
        form.reset();
        clearValidationErrors();
        hideMessages();
        
        // Show modal (using Bootstrap 4 modal)
        $(modal).modal('show');
    });
    
    // Save patient when save button is clicked
    saveBtn.addEventListener('click', () => {
        saveNewPatient();
    });
    
    // Also save on Enter in form fields
    form.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveNewPatient();
        }
    });
    
    /**
     * Save new patient via AJAX
     */
    function saveNewPatient() {
        const formData = new FormData(form);
        const patientData = {
            first_name: formData.get('first_name').trim(),
            last_name: formData.get('last_name').trim(),
            phone: formData.get('phone').trim(),
            email: formData.get('email').trim(),
            address: formData.get('address').trim()
        };
        
        console.log('Saving new patient:', patientData);
        
        // Validate required fields
        if (!patientData.first_name || !patientData.last_name) {
            showValidationError('newPatientFirstName', 'First name is required');
            showValidationError('newPatientLastName', 'Last name is required');
            return;
        }
        
        // Clear any previous errors
        clearValidationErrors();
        hideMessages();
        
        // Show loading state
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        fetch('/create_patient', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Patient created successfully:', data.patient);
                
                // Show success message
                showSuccessMessage(`Patient "${data.patient.text}" created successfully!`);
                  // Update the patient search with the new patient
                const searchBox = document.getElementById('patient-search');
                const hiddenInput = document.getElementById('patient_id');
                
                if (searchBox && hiddenInput) {
                    searchBox.value = data.patient.text;
                    hiddenInput.value = data.patient.id;
                    
                    console.log('=== NEW PATIENT CREATED AND SELECTED ===');
                    console.log('New patient data:', data.patient);
                    console.log('Search box updated with:', data.patient.text);
                    console.log('Hidden input updated with ID:', data.patient.id);
                    console.log('Hidden input element:', hiddenInput);
                    console.log('Hidden input name:', hiddenInput.name);
                    console.log('Hidden input final value:', hiddenInput.value);
                    console.log('=== END NEW PATIENT SELECTION ===');
                }
                
                // Close modal after a short delay
                setTimeout(() => {
                    $(modal).modal('hide');
                    form.reset();
                    clearValidationErrors();
                    hideMessages();
                }, 1500);
                
            } else {
                console.error('Failed to create patient:', data.error);
                showErrorMessage(data.error || 'Failed to create patient');
            }
        })
        .catch(error => {
            console.error('Error creating patient:', error);
            showErrorMessage('Network error: ' + error.message);
        })
        .finally(() => {
            // Reset button state
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Patient';
        });
    }
    
    /**
     * Show validation error for a field
     */
    function showValidationError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('is-invalid');
            const feedback = field.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.textContent = message;
            }
        }
    }
    
    /**
     * Clear all validation errors
     */
    function clearValidationErrors() {
        const fields = form.querySelectorAll('.form-control');
        fields.forEach(field => {
            field.classList.remove('is-invalid');
            const feedback = field.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.textContent = '';
            }
        });
    }
    
    /**
     * Show error message
     */
    function showErrorMessage(message) {
        const errorDiv = document.getElementById('patientCreationError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('d-none');
        }
    }
    
    /**
     * Show success message
     */
    function showSuccessMessage(message) {
        const successDiv = document.getElementById('patientCreationSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('d-none');
        }
    }
    
    /**
     * Hide all messages
     */
    function hideMessages() {
        const errorDiv = document.getElementById('patientCreationError');
        const successDiv = document.getElementById('patientCreationSuccess');
        
        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');
    }
}

// Make functions globally available
window.addPrescription = addPrescription;
window.removePrescription = removePrescription;
window.addDocument = addDocument;
window.removeDocument = removeDocument;
window.validateForm = validateForm;
