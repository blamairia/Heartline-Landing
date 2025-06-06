/**
 * Appointments Table JavaScript
 * Handles appointment table interactions, filtering, and AJAX operations
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeAppointmentTable();
    initializeFilters();
    initializeEventListeners();
});

/**
 * Initialize the appointments table with sorting and interaction features
 */
function initializeAppointmentTable() {
    const table = document.getElementById('appointmentsTable');
    if (!table) return;

    // Add table hover effects
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });

    // Initialize tooltips for action buttons
    if (typeof $ !== 'undefined' && $.fn.tooltip) {
        $('[data-toggle="tooltip"]').tooltip();
    }
}

/**
 * Initialize filter functionality
 */
function initializeFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.getElementById('appointmentSearch');

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
}

/**
 * Initialize event listeners for appointment actions
 */
function initializeEventListeners() {
    // Listen for appointment action buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.edit-appointment-btn')) {
            const appointmentId = e.target.closest('.edit-appointment-btn').dataset.appointmentId;
            editAppointment(appointmentId);
        }
        
        if (e.target.closest('.create-visit-btn')) {
            const appointmentId = e.target.closest('.create-visit-btn').dataset.appointmentId;
            createVisitFromAppointment(appointmentId);
        }
        
        if (e.target.closest('.delete-appointment-btn')) {
            const appointmentId = e.target.closest('.delete-appointment-btn').dataset.appointmentId;
            deleteAppointment(appointmentId);
        }
        
        if (e.target.closest('.status-update-btn')) {
            const appointmentId = e.target.closest('.status-update-btn').dataset.appointmentId;
            const newStatus = e.target.closest('.status-update-btn').dataset.status;
            updateAppointmentStatus(appointmentId, newStatus);
        }
    });
}

/**
 * Apply filters to the appointments table
 */
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.getElementById('appointmentSearch');
    const table = document.getElementById('appointmentsTable');
    
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const statusValue = statusFilter ? statusFilter.value.toLowerCase() : '';
    const dateValue = dateFilter ? dateFilter.value : '';
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';

    rows.forEach(row => {
        let showRow = true;

        // Status filter
        if (statusValue && statusValue !== 'all') {
            const status = row.dataset.status ? row.dataset.status.toLowerCase() : '';
            if (status !== statusValue) {
                showRow = false;
            }
        }

        // Date filter
        if (dateValue && showRow) {
            const appointmentDate = row.dataset.date;
            if (appointmentDate && !appointmentDate.startsWith(dateValue)) {
                showRow = false;
            }
        }

        // Search filter
        if (searchValue && showRow) {
            const rowText = row.textContent.toLowerCase();
            if (!rowText.includes(searchValue)) {
                showRow = false;
            }
        }

        row.style.display = showRow ? '' : 'none';
    });

    updateTableStats();
}

/**
 * Update table statistics after filtering
 */
function updateTableStats() {
    const table = document.getElementById('appointmentsTable');
    if (!table) return;

    const visibleRows = table.querySelectorAll('tbody tr:not([style*="display: none"])');
    const totalRows = table.querySelectorAll('tbody tr');
    
    const statsElement = document.getElementById('tableStats');
    if (statsElement) {
        statsElement.textContent = `Showing ${visibleRows.length} of ${totalRows.length} appointments`;
    }
}

/**
 * Edit appointment
 */
function editAppointment(appointmentId) {
    if (!appointmentId) return;
    
    window.location.href = `/appointment/${appointmentId}/edit`;
}

/**
 * Update appointment status
 */
function updateAppointmentStatus(appointmentId, newStatus) {
    if (!appointmentId || !newStatus) return;

    const confirmMessage = `Are you sure you want to mark this appointment as ${newStatus}?`;
    if (!confirm(confirmMessage)) return;

    fetch(`/api/appointments/${appointmentId}/update-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload(); // Reload to show updated status
        } else {
            alert('Error: ' + (data.message || 'Failed to update status'));
        }
    })
    .catch(error => {
        console.error('Error updating appointment status:', error);
        alert('Error updating appointment status');
    });
}

/**
 * Create visit from appointment
 */
function createVisitFromAppointment(appointmentId) {
    if (!appointmentId) return;

    if (!confirm('Create a visit record from this appointment?')) return;

    fetch(`/api/appointments/${appointmentId}/create-visit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Visit created successfully!');
            if (data.visit_id) {
                window.location.href = `/visit/${data.visit_id}`;
            } else {
                location.reload();
            }
        } else {
            alert('Error: ' + (data.message || 'Failed to create visit'));
        }
    })
    .catch(error => {
        console.error('Error creating visit:', error);
        alert('Error creating visit from appointment');
    });
}

/**
 * Delete appointment
 */
function deleteAppointment(appointmentId) {
    if (!appointmentId) return;

    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) return;

    fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload(); // Reload to remove deleted appointment
        } else {
            alert('Error: ' + (data.message || 'Failed to delete appointment'));
        }
    })
    .catch(error => {
        console.error('Error deleting appointment:', error);
        alert('Error deleting appointment');
    });
}

/**
 * Export appointments data
 */
function exportAppointments() {
    const link = document.createElement('a');
    link.href = '/api/appointments/export';
    link.download = 'appointments.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Print appointments table
 */
function printAppointments() {
    window.print();
}

/**
 * Utility function for debouncing
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility function for formatting dates
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Utility function for getting appointment status color
 */
function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'scheduled':
            return 'warning';
        case 'completed':
            return 'success';
        case 'canceled':
            return 'danger';
        default:
            return 'secondary';
    }
}

// Global functions for inline onclick handlers (if needed)
window.editAppointment = editAppointment;
window.createVisitFromAppointment = createVisitFromAppointment;
window.deleteAppointment = deleteAppointment;
window.updateAppointmentStatus = updateAppointmentStatus;
window.exportAppointments = exportAppointments;
window.printAppointments = printAppointments;