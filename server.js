/*
 * ============================================================
 * HealthLink 2035 – Smart Hospital Management System
 * server.js
 *
 * Purpose: Main Node.js Express server. Serves static files,
 *          handles API routes for patient registration,
 *          appointment scheduling, vitals recording, and
 *          dynamic dashboard pages.
 *
 * Run: node server.js
 * ============================================================
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// ---- Middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from web/ directory
app.use(express.static(path.join(__dirname, 'web')));

// ============================================================
// JSON FILE DATABASE
// Simple file-based storage (no MongoDB/external DB required)
// ============================================================
const DB_FILE = path.join(__dirname, 'database', 'data.json');

/** Load the database from file */
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('Error loading DB, using defaults:', e.message);
    }
    // Default data structure with sample data
    return getDefaultData();
}

/** Save the database to file */
function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** Returns default sample data */
function getDefaultData() {
    const today = new Date().toISOString().split('T')[0];
    return {
        counters: { patientId: 3, doctorId: 4, appointmentId: 3, vitalId: 3 },
        doctors: [
            { doctorId: 1, name: "Dr. Ananya Sharma", specialization: "Cardiology", phone: "9876543210", email: "ananya.sharma@healthlink.org" },
            { doctorId: 2, name: "Dr. Rajesh Verma", specialization: "General Medicine", phone: "9876543211", email: "rajesh.verma@healthlink.org" },
            { doctorId: 3, name: "Dr. Priya Nair", specialization: "Neurology", phone: "9876543212", email: "priya.nair@healthlink.org" },
            { doctorId: 4, name: "Dr. Suresh Patel", specialization: "Orthopedics", phone: "9876543213", email: "suresh.patel@healthlink.org" }
        ],
        patients: [],
        appointments: [],
        vitals: []
    };
}

// Initialize database
let db = loadDB();
if (!db.patients) {
    db = getDefaultData();
    saveDB(db);
}

/** Get next auto-increment ID */
function getNextId(counterName) {
    db.counters[counterName] = (db.counters[counterName] || 0) + 1;
    saveDB(db);
    return db.counters[counterName];
}

// ============================================================
// AI ALERT ENGINE
// Evaluates vital signs and returns clinical alerts
// ============================================================
function generateAlert(heartRate, systolicBP, temperature) {
    let alerts = [];

    // Heart Rate analysis
    if (heartRate > 100) {
        alerts.push(`⚠ TACHYCARDIA ALERT: Heart rate is elevated (${heartRate} BPM)`);
    } else if (heartRate < 50) {
        alerts.push(`⚠ BRADYCARDIA ALERT: Heart rate is critically low (${heartRate} BPM)`);
    }

    // Temperature analysis
    if (temperature > 38.0) {
        alerts.push(`🌡 FEVER ALERT: Temperature is high (${temperature} °C)`);
    } else if (temperature < 35.0) {
        alerts.push(`🌡 HYPOTHERMIA ALERT: Temperature is critically low (${temperature} °C)`);
    }

    // Blood Pressure analysis
    if (systolicBP > 140) {
        alerts.push(`💓 HYPERTENSION ALERT: Systolic BP is elevated (${systolicBP} mmHg)`);
    } else if (systolicBP < 90) {
        alerts.push(`💓 HYPOTENSION ALERT: Systolic BP is critically low (${systolicBP} mmHg)`);
    }

    if (alerts.length === 0) {
        return '✅ Vitals Normal – All parameters are within healthy range.';
    }
    return alerts.join(' | ');
}

// ============================================================
// SHARED HTML TEMPLATE FUNCTIONS
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pageStart(title, activePage) {
    const navLinks = [
        { href: '/', label: 'Home (Roles)' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/PatientRegistration.html', label: 'Register Patient' },
        { href: '/AppointmentScheduling.html', label: 'Appointments' },
        { href: '/VitalsEntry.html', label: 'Vitals' },
        { href: '/doctor-schedule', label: 'Doctor Schedule' },
        { href: '/vitals-analytics', label: 'Vitals Analytics' }
    ];
    const navHtml = navLinks.map(l =>
        `<li><a href="${l.href}"${l.label === activePage ? " class='active'" : ""}>${l.label}</a></li>`
    ).join('\n        ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} – HealthLink 2035</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">
            <span class="brand-icon">🏥</span>
            <span class="brand-text">HealthLink <span class="brand-year">2035</span></span>
        </div>
        <ul class="nav-links">
        ${navHtml}
        </ul>
    </nav>
    <main class="main-content" style="align-items: flex-start;">
        <div class="dashboard-container">
`;
}

function pageEnd() {
    return `
        </div>
    </main>
    <footer class="footer">
        <p>&copy; 2035 HealthLink Smart Hospital Management System. All rights reserved.</p>
    </footer>
</body>
</html>`;
}

// ============================================================
// API ROUTES
// ============================================================

// ---- Root ----
// Handled by express.static serving index.html

// ---- Register Patient (POST) ----
app.post('/RegisterPatient', (req, res) => {
    const { name, dob, gender, phone, address } = req.body;
    const patientId = getNextId('patientId');
    db.patients.push({ patientId, name, dob, gender, phone, address });
    saveDB(db);
    res.redirect(`/dashboard?searchId=${patientId}&msg=${encodeURIComponent('Patient registered successfully! Your Patient ID is: ' + patientId)}`);
});

// ---- Schedule Appointment (POST) ----
app.post('/ScheduleAppointment', (req, res) => {
    const patientId = parseInt(req.body.patientId);
    const doctorId = parseInt(req.body.doctorId);
    const { appointmentDate, appointmentTime } = req.body;
    const appointmentId = getNextId('appointmentId');
    db.appointments.push({ appointmentId, patientId, doctorId, appointmentDate, appointmentTime, status: 'Scheduled' });
    saveDB(db);
    res.redirect(`/dashboard?msg=${encodeURIComponent('Appointment scheduled successfully')}`);
});

// ---- Record Vitals (POST) ----
app.post('/RecordVitals', (req, res) => {
    const patientId = parseInt(req.body.patientId);
    const heartRate = parseInt(req.body.heartRate);
    const systolicBP = parseInt(req.body.systolicBP);
    const temperature = parseFloat(req.body.temperature);
    const vitalId = getNextId('vitalId');

    db.vitals.push({
        vitalId, patientId, heartRate, systolicBP, temperature,
        recordedDate: new Date().toISOString()
    });
    saveDB(db);

    const alert = generateAlert(heartRate, systolicBP, temperature);
    res.redirect(`/dashboard?msg=${encodeURIComponent('Vitals recorded successfully')}&patientId=${patientId}&alert=${encodeURIComponent(alert)}`);
});

// ---- API: Get all doctors (for dropdowns) ----
app.get('/api/doctors', (req, res) => {
    res.json(db.doctors);
});

// ---- API: Get all patients (for dropdowns) ----
app.get('/api/patients', (req, res) => {
    res.json(db.patients);
});

// ============================================================
// DYNAMIC PAGE ROUTES
// ============================================================

// ---- Dashboard ----
app.get('/dashboard', (req, res) => {
    let html = pageStart('Dashboard', 'Dashboard');

    // Messages
    if (req.query.msg) html += `<div class="message message-success">${escapeHtml(req.query.msg)}</div>`;
    if (req.query.error) html += `<div class="message message-error">${escapeHtml(req.query.error)}</div>`;

    // Search bar
    const searchId = req.query.searchId || '';
    html += `
        <div class="search-section">
            <form action="/dashboard" method="GET" style="display:flex; gap:1rem; width:100%; align-items:flex-end;">
                <div class="form-group">
                    <label for="searchId">Search by Patient ID</label>
                    <input type="number" id="searchId" name="searchId" placeholder="Enter Patient ID" min="1" value="${escapeHtml(searchId)}">
                </div>
                <button type="submit" class="btn btn-primary" style="height:42px;">Search</button>
            </form>
        </div>`;

    const displayId = searchId || req.query.patientId || null;

    if (displayId) {
        const patientId = parseInt(displayId);
        const patient = db.patients.find(p => p.patientId === patientId);

        html += `<div class="dashboard-grid">`;

        // Patient Details Card
        html += `<div class="card"><h2>👤 Patient Details</h2>`;
        if (patient) {
            html += `<table>
                <tr><th>Field</th><th>Value</th></tr>
                <tr><td>Patient ID</td><td>${patient.patientId}</td></tr>
                <tr><td>Name</td><td>${escapeHtml(patient.name)}</td></tr>
                <tr><td>Date of Birth</td><td>${escapeHtml(patient.dob)}</td></tr>
                <tr><td>Gender</td><td>${escapeHtml(patient.gender)}</td></tr>
                <tr><td>Phone</td><td>${escapeHtml(patient.phone)}</td></tr>
                <tr><td>Address</td><td>${escapeHtml(patient.address)}</td></tr>
            </table>`;
        } else {
            html += `<p style="color: var(--danger);">No patient found with ID ${patientId}.</p>`;
        }
        html += `</div>`;

        // Appointments Card
        html += `<div class="card"><h2>📅 Upcoming Appointments</h2>`;
        const appts = db.appointments
            .filter(a => a.patientId === patientId)
            .sort((a, b) => (a.appointmentDate + a.appointmentTime).localeCompare(b.appointmentDate + b.appointmentTime));

        html += `<table><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Status</th></tr>`;
        if (appts.length > 0) {
            appts.forEach(a => {
                const doc = db.doctors.find(d => d.doctorId === a.doctorId);
                const docName = doc ? doc.name : 'Unknown';
                const badge = a.status === 'Completed' ? 'status-badge status-completed' : 'status-badge status-scheduled';
                html += `<tr><td>${escapeHtml(a.appointmentDate)}</td><td>${escapeHtml(a.appointmentTime)}</td>
                    <td>${escapeHtml(docName)}</td><td><span class="${badge}">${escapeHtml(a.status)}</span></td></tr>`;
            });
        } else {
            html += `<tr><td colspan="4" style="text-align:center;">No appointments found.</td></tr>`;
        }
        html += `</table></div>`;

        // Vitals History Card
        html += `<div class="card"><h2>❤️ Vitals History</h2>`;
        const vits = db.vitals
            .filter(v => v.patientId === patientId)
            .sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate))
            .slice(0, 10);

        html += `<table><tr><th>Heart Rate</th><th>BP (Systolic)</th><th>Temp (°C)</th><th>Recorded</th></tr>`;
        if (vits.length > 0) {
            vits.forEach(v => {
                const d = new Date(v.recordedDate);
                html += `<tr><td>${v.heartRate} BPM</td><td>${v.systolicBP} mmHg</td>
                    <td>${v.temperature} °C</td><td>${d.toLocaleString()}</td></tr>`;
            });
        } else {
            html += `<tr><td colspan="4" style="text-align:center;">No vitals recorded.</td></tr>`;
        }
        html += `</table></div>`;

        // Alert Status Card
        html += `<div class="card"><h2>🚨 Current Alert Status</h2>`;
        let alertMsg;
        if (req.query.alert) {
            alertMsg = req.query.alert;
        } else if (vits.length > 0) {
            alertMsg = generateAlert(vits[0].heartRate, vits[0].systolicBP, vits[0].temperature);
        } else {
            alertMsg = 'No vitals data available for alert analysis.';
        }

        let alertClass;
        if (alertMsg.includes('Normal') || alertMsg.includes('✅')) alertClass = 'alert-box alert-success';
        else if (alertMsg.includes('No vitals')) alertClass = 'alert-box alert-warning';
        else alertClass = 'alert-box alert-danger';

        html += `<div class="${alertClass}">${escapeHtml(alertMsg)}</div></div>`;
        html += `</div>`; // close grid
    } else {
        html += `<div class="card" style="max-width:600px; margin:2rem auto; text-align:center;">
            <h2>Welcome to HealthLink 2035</h2>
            <p style="color: var(--text-secondary); margin-top:0.5rem;">
                Enter a Patient ID above to view their dashboard, or use the navigation links.</p></div>`;
    }

    html += pageEnd();
    res.send(html);
});

// ---- Doctor Schedule ----
app.get('/doctor-schedule', (req, res) => {
    let html = pageStart('Doctor Schedule', 'Doctor Schedule');

    const doctorIdParam = req.query.doctorId || '';
    const schedDateParam = req.query.schedDate || '';

    html += `
        <div class="search-section">
            <form action="/doctor-schedule" method="GET" style="display:flex; gap:1rem; width:100%; align-items:flex-end; flex-wrap:wrap;">
                <div class="form-group">
                    <label for="doctorId">Doctor ID</label>
                    <input type="number" id="doctorId" name="doctorId" placeholder="Enter Doctor ID" min="1" value="${escapeHtml(doctorIdParam)}">
                </div>
                <div class="form-group">
                    <label for="schedDate">Date</label>
                    <input type="date" id="schedDate" name="schedDate" value="${escapeHtml(schedDateParam)}">
                </div>
                <button type="submit" class="btn btn-primary" style="height:42px;">View Schedule</button>
            </form>
        </div>`;

    if (doctorIdParam && schedDateParam) {
        const doctorId = parseInt(doctorIdParam);
        const doc = db.doctors.find(d => d.doctorId === doctorId);
        const docName = doc ? doc.name : 'Unknown';
        const docSpec = doc ? doc.specialization : '';

        html += `<div class="card"><h2>📋 Schedule for ${escapeHtml(docName)} (${escapeHtml(docSpec)}) — ${escapeHtml(schedDateParam)}</h2>`;

        const schedAppts = db.appointments
            .filter(a => a.doctorId === doctorId && a.appointmentDate === schedDateParam)
            .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));

        html += `<table><tr><th>#</th><th>Patient Name</th><th>Date</th><th>Time</th></tr>`;
        if (schedAppts.length > 0) {
            schedAppts.forEach((a, i) => {
                const pat = db.patients.find(p => p.patientId === a.patientId);
                const patName = pat ? pat.name : 'Unknown';
                html += `<tr><td>${i + 1}</td><td>${escapeHtml(patName)}</td>
                    <td>${escapeHtml(a.appointmentDate)}</td><td>${escapeHtml(a.appointmentTime)}</td></tr>`;
            });
        } else {
            html += `<tr><td colspan="4" style="text-align:center;">No appointments found for this date.</td></tr>`;
        }
        html += `</table></div>`;
    } else {
        html += `<div class="card" style="max-width:600px; margin:2rem auto; text-align:center;">
            <h2>Doctor Schedule Viewer</h2>
            <p style="color: var(--text-secondary); margin-top:0.5rem;">
                Enter a Doctor ID and date above to view their appointment schedule.</p></div>`;
    }

    html += pageEnd();
    res.send(html);
});

// ---- Vitals Analytics ----
app.get('/vitals-analytics', (req, res) => {
    let html = pageStart('Vitals Analytics', 'Vitals Analytics');

    const pidParam = req.query.patientId || '';

    html += `
        <div class="search-section">
            <form action="/vitals-analytics" method="GET" style="display:flex; gap:1rem; width:100%; align-items:flex-end;">
                <div class="form-group">
                    <label for="patientId">Patient ID</label>
                    <input type="number" id="patientId" name="patientId" placeholder="Enter Patient ID" min="1" value="${escapeHtml(pidParam)}">
                </div>
                <button type="submit" class="btn btn-primary" style="height:42px;">View Analytics</button>
            </form>
        </div>`;

    if (pidParam) {
        const patientId = parseInt(pidParam);
        const patient = db.patients.find(p => p.patientId === patientId);
        const patientName = patient ? patient.name : 'Unknown';
        const patVitals = db.vitals.filter(v => v.patientId === patientId);

        html += `<div class="dashboard-grid">`;

        // Analytics Card
        html += `<div class="card"><h2>📊 Vitals Analytics – ${escapeHtml(patientName)} (ID: ${patientId})</h2>`;
        html += `<table><tr><th>Metric</th><th>Average Value</th></tr>`;
        if (patVitals.length > 0) {
            const avgHR = (patVitals.reduce((s, v) => s + v.heartRate, 0) / patVitals.length).toFixed(1);
            const avgBP = (patVitals.reduce((s, v) => s + v.systolicBP, 0) / patVitals.length).toFixed(1);
            html += `<tr><td>Average Heart Rate</td><td>${avgHR} BPM</td></tr>`;
            html += `<tr><td>Average Systolic BP</td><td>${avgBP} mmHg</td></tr>`;
        } else {
            html += `<tr><td colspan="2" style="text-align:center;">No vitals data available.</td></tr>`;
        }
        html += `</table></div>`;

        // History Card
        html += `<div class="card"><h2>📋 Complete Vitals History</h2>`;
        html += `<table><tr><th>Vital ID</th><th>Heart Rate</th><th>BP (Systolic)</th><th>Temp (°C)</th><th>Recorded Date</th></tr>`;

        const sorted = [...patVitals].sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate));
        if (sorted.length > 0) {
            sorted.forEach(v => {
                const d = new Date(v.recordedDate);
                html += `<tr><td>${v.vitalId}</td><td>${v.heartRate} BPM</td><td>${v.systolicBP} mmHg</td>
                    <td>${v.temperature} °C</td><td>${d.toLocaleString()}</td></tr>`;
            });
        } else {
            html += `<tr><td colspan="5" style="text-align:center;">No vitals records found.</td></tr>`;
        }
        html += `</table></div>`;
        html += `</div>`; // close grid
    } else {
        html += `<div class="card" style="max-width:600px; margin:2rem auto; text-align:center;">
            <h2>Patient Vitals Analytics</h2>
            <p style="color: var(--text-secondary); margin-top:0.5rem;">
                Enter a Patient ID above to view their vitals history and aggregate analytics.</p></div>`;
    }

    html += pageEnd();
    res.send(html);
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('============================================');
    console.log('  HealthLink 2035 - Server Started');
    console.log(`  Local Access:   http://localhost:${PORT}`);
    console.log(`  Network Access: http://10.1.7.233:${PORT}`);
    console.log('============================================');
    console.log('  Pages:');
    console.log(`    Role Selection:   http://localhost:${PORT}/`);
    console.log(`    Patient Portal:   http://localhost:${PORT}/patient-portal.html`);
    console.log(`    Dashboard:        http://localhost:${PORT}/dashboard`);
    console.log(`    Register:         http://localhost:${PORT}/PatientRegistration.html`);
    console.log(`    Appointments:     http://localhost:${PORT}/AppointmentScheduling.html`);
    console.log(`    Vitals:           http://localhost:${PORT}/VitalsEntry.html`);
    console.log(`    Doctor Schedule:  http://localhost:${PORT}/doctor-schedule`);
    console.log(`    Vitals Analytics: http://localhost:${PORT}/vitals-analytics`);
    console.log('============================================');
    console.log('  Press Ctrl+C to stop the server.');
    console.log('============================================');
});
