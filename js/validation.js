/*
 * ============================================================
 * HealthLink 2035 – Smart Hospital Management System
 * validation.js
 *
 * Purpose: Client-side form validation for patient registration,
 *          appointment scheduling, and vitals entry forms.
 *          Displays alert messages when validation rules fail.
 * ============================================================
 */

/**
 * validatePatientForm()
 * Validates the Patient Registration form.
 * Rules:
 *   - Name cannot be empty
 *   - DOB cannot be empty
 *   - Gender must be selected
 *   - Phone must be a 10-digit number
 *   - Address cannot be empty
 *
 * @returns {boolean} true if all validations pass, false otherwise
 */
function validatePatientForm() {
    // Retrieve form field values and trim whitespace
    var name    = document.getElementById("name").value.trim();
    var dob     = document.getElementById("dob").value.trim();
    var gender  = document.getElementById("gender").value;
    var phone   = document.getElementById("phone").value.trim();
    var address = document.getElementById("address").value.trim();

    // --- Name validation ---
    if (name === "") {
        alert("Error: Patient name cannot be empty.");
        return false;
    }

    // --- DOB validation ---
    if (dob === "") {
        alert("Error: Date of Birth is required.");
        return false;
    }

    // --- Gender validation ---
    if (gender === "") {
        alert("Error: Please select a gender.");
        return false;
    }

    // --- Phone validation (10-digit number) ---
    var phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        alert("Error: Phone number must be exactly 10 digits.");
        return false;
    }

    // --- Address validation ---
    if (address === "") {
        alert("Error: Address cannot be empty.");
        return false;
    }

    // All validations passed
    return true;
}

/**
 * validateAppointmentForm()
 * Validates the Appointment Scheduling form.
 * Rules:
 *   - Patient ID must be a positive integer
 *   - Doctor ID must be a positive integer
 *   - Appointment Date cannot be empty
 *   - Appointment Time cannot be empty
 *
 * @returns {boolean} true if all validations pass, false otherwise
 */
function validateAppointmentForm() {
    // Retrieve form field values
    var patientId       = document.getElementById("patientId").value.trim();
    var doctorId        = document.getElementById("doctorId").value.trim();
    var appointmentDate = document.getElementById("appointmentDate").value.trim();
    var appointmentTime = document.getElementById("appointmentTime").value.trim();

    // --- Patient ID validation ---
    if (patientId === "" || parseInt(patientId) <= 0) {
        alert("Error: Please enter a valid Patient ID (positive number).");
        return false;
    }

    // --- Doctor ID validation ---
    if (doctorId === "" || parseInt(doctorId) <= 0) {
        alert("Error: Please enter a valid Doctor ID (positive number).");
        return false;
    }

    // --- Appointment Date validation ---
    if (appointmentDate === "") {
        alert("Error: Appointment date is required.");
        return false;
    }

    // --- Appointment Time validation ---
    if (appointmentTime === "") {
        alert("Error: Appointment time is required.");
        return false;
    }

    // All validations passed
    return true;
}

/**
 * validateVitalsForm()
 * Validates the Vitals Entry form.
 * Rules:
 *   - Patient ID must be a positive integer
 *   - Heart Rate must be between 40 and 150 BPM
 *   - Systolic BP must be a positive integer
 *   - Temperature must be between 35.0 and 42.0 °C
 *
 * @returns {boolean} true if all validations pass, false otherwise
 */
function validateVitalsForm() {
    // Retrieve form field values
    var patientId   = document.getElementById("patientId").value.trim();
    var heartRate   = document.getElementById("heartRate").value.trim();
    var systolicBP  = document.getElementById("systolicBP").value.trim();
    var temperature = document.getElementById("temperature").value.trim();

    // --- Patient ID validation ---
    if (patientId === "" || parseInt(patientId) <= 0) {
        alert("Error: Please enter a valid Patient ID (positive number).");
        return false;
    }

    // --- Heart Rate validation (40 – 150 BPM) ---
    var hr = parseInt(heartRate);
    if (isNaN(hr) || hr < 40 || hr > 150) {
        alert("Error: Heart Rate must be between 40 and 150 BPM.");
        return false;
    }

    // --- Systolic BP validation ---
    var bp = parseInt(systolicBP);
    if (isNaN(bp) || bp <= 0) {
        alert("Error: Systolic Blood Pressure must be a positive number.");
        return false;
    }

    // --- Temperature validation (35.0 – 42.0 °C) ---
    var temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 35.0 || temp > 42.0) {
        alert("Error: Temperature must be between 35.0 and 42.0 °C.");
        return false;
    }

    // All validations passed
    return true;
}
