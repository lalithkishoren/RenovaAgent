// =================================================================
// RENOVA HOSPITALS EXECUTIVE DASHBOARD - NODE.JS SERVER
// COMPLETE LATEST VERSION WITH ALL FIXES
// =================================================================

const express = require('express');
const XLSX = require('xlsx');
const cors = require('cors');
const path = require('path');
const moment = require('moment');
const admin = require('firebase-admin');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: 'codecanyon-landing.appspot.com'
    });
    console.log('🔥 Firebase Admin initialized successfully');
} catch (error) {
    console.log('⚠️  Firebase Admin initialization failed, using local file fallback:', error.message);
}

// Multer configuration for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Global variables to store data
let hospitalData = {
    doctors: [],
    patients: [],
    visits: [],
    financial: [],
    quality: [],
    performance: []
};

// Load Excel data from Firebase Storage or local fallback
async function loadExcelDataFromStorage() {
    try {
        console.log('🔄 Loading Excel data from Firebase Storage...');
        const bucket = admin.storage().bucket();
        const file = bucket.file('hospital_data.xlsx');
        
        // Check if file exists in Firebase Storage
        const [exists] = await file.exists();
        if (!exists) {
            console.log('📁 File not found in Firebase Storage, using local fallback...');
            return loadExcelData();
        }
        
        // Download the file to a temporary location
        const tempFilePath = './temp_hospital_data.xlsx';
        await file.download({ destination: tempFilePath });
        
        // Read the downloaded Excel file
        const workbook = XLSX.readFile(tempFilePath);
        
        // Process the data
        processExcelWorkbook(workbook);
        
        // Clean up temporary file
        fs.unlinkSync(tempFilePath);
        
        console.log('✅ Excel data loaded successfully from Firebase Storage!');
        
    } catch (error) {
        console.error('❌ Error loading from Firebase Storage:', error.message);
        console.log('🔄 Falling back to local file...');
        loadExcelData();
    }
}

// Load Excel data function (local fallback)
function loadExcelData() {
    try {
        console.log('🔄 Loading Excel data from local file...');
        // Read the Excel file
        const workbook = XLSX.readFile('./public/data/hospital_data.xlsx');
        processExcelWorkbook(workbook);
        console.log('✅ Excel data loaded successfully from local file!');
    } catch (error) {
        console.error('❌ Error loading Excel data:', error.message);
        console.log('📝 Please ensure your Excel file is at ./public/data/hospital_data.xlsx');
        
        // Generate sample data if Excel file not found
        generateSampleData();
    }
}

// Process Excel workbook (shared logic)
function processExcelWorkbook(workbook) {
    try {
        
        // Read each sheet - your file has these exact sheet names
        hospitalData.doctors = XLSX.utils.sheet_to_json(workbook.Sheets['hospital_doctors']);
        hospitalData.patients = XLSX.utils.sheet_to_json(workbook.Sheets['hospital_patients']);
        hospitalData.visits = XLSX.utils.sheet_to_json(workbook.Sheets['hospital_patient_visits']);
        hospitalData.financial = XLSX.utils.sheet_to_json(workbook.Sheets['hospital_financial_metrics']);
        hospitalData.quality = XLSX.utils.sheet_to_json(workbook.Sheets['hospital_quality_metrics']);
        hospitalData.performance = XLSX.utils.sheet_to_json(workbook.Sheets['hospital_staff_performance']);
        
        // Convert Excel serial dates to proper dates
        console.log('🔄 Converting Excel date numbers to proper dates...');
        
        // Convert visit dates
        hospitalData.visits = hospitalData.visits.map(visit => {
            if (visit.visit_date && typeof visit.visit_date === 'number') {
                // Convert Excel serial date to JavaScript date
                const excelDate = new Date((visit.visit_date - 25569) * 86400 * 1000);
                visit.visit_date = excelDate.toISOString();
            }
            return visit;
        });
        
        // Convert financial dates
        hospitalData.financial = hospitalData.financial.map(record => {
            if (record.date && typeof record.date === 'number') {
                const excelDate = new Date((record.date - 25569) * 86400 * 1000);
                record.date = excelDate.toISOString();
            }
            return record;
        });
        
        // Convert patient registration dates
        hospitalData.patients = hospitalData.patients.map(patient => {
            if (patient.registration_date && typeof patient.registration_date === 'number') {
                const excelDate = new Date((patient.registration_date - 25569) * 86400 * 1000);
                patient.registration_date = excelDate.toISOString();
            }
            return patient;
        });
        
        // Convert doctor hire dates
        hospitalData.doctors = hospitalData.doctors.map(doctor => {
            if (doctor.hire_date && typeof doctor.hire_date === 'number') {
                const excelDate = new Date((doctor.hire_date - 25569) * 86400 * 1000);
                doctor.hire_date = excelDate.toISOString();
            }
            return doctor;
        });
        
        // Convert quality metric dates
        hospitalData.quality = hospitalData.quality.map(record => {
            if (record.date && typeof record.date === 'number') {
                const excelDate = new Date((record.date - 25569) * 86400 * 1000);
                record.date = excelDate.toISOString();
            }
            return record;
        });
        
        console.log('✅ Excel data loaded successfully!');
        console.log(`📊 Data Summary:
        - Doctors: ${hospitalData.doctors.length}
        - Patients: ${hospitalData.patients.length}
        - Visits: ${hospitalData.visits.length}
        - Financial Records: ${hospitalData.financial.length}
        - Quality Metrics: ${hospitalData.quality.length}
        - Performance Records: ${hospitalData.performance.length}`);
        
        // Debug: Check converted data formats
        console.log('🔍 Debug - Sample visit date (converted):', hospitalData.visits[0]?.visit_date);
        console.log('🔍 Debug - Sample financial date (converted):', hospitalData.financial[0]?.date);
        console.log('🔍 Debug - Sample visit cost:', hospitalData.visits[0]?.total_cost);
        console.log('🔍 Debug - Sample department:', hospitalData.visits[0]?.department);
        
        // Check a few converted dates
        const sampleVisit = hospitalData.visits[0];
        if (sampleVisit?.visit_date) {
            const testDate = new Date(sampleVisit.visit_date);
            console.log('🔍 Debug - Converted date year:', testDate.getFullYear());
            console.log('🔍 Debug - Converted date month:', testDate.getMonth() + 1);
        }
        
    } catch (error) {
        console.error('❌ Error loading Excel data:', error.message);
        console.log('📝 Please ensure your Excel file is at ./public/data/hospital_data.xlsx');
        
        // Generate sample data if Excel file not found
        generateSampleData();
    }
}

// Generate sample data for testing
function generateSampleData() {
    console.log('🔄 Generating sample data for testing...');
    
    const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency Medicine', 'Internal Medicine', 'Pediatrics'];
    
    // Sample financial data with proper dates
    hospitalData.financial = Array.from({length: 12}, (_, i) => {
        const month = i + 1;
        const revenue = 8000000 + Math.random() * 7000000;
        const expenses = 6000000 + Math.random() * 6000000;
        const profit = revenue - expenses;
        
        return {
            year: 2024,
            month: month,
            date: `2024-${String(month).padStart(2, '0')}-01T00:00:00.000Z`,
            total_revenue: revenue,
            operating_expenses: expenses,
            net_profit: profit,
            profit_margin: profit / revenue,
            bed_occupancy_rate: 0.7 + Math.random() * 0.25,
            average_daily_census: 200 + Math.random() * 200
        };
    });
    
    // Sample doctors data
    hospitalData.doctors = Array.from({length: 150}, (_, i) => ({
        doctor_id: `DOC_${String(i + 1).padStart(4, '0')}`,
        name: `Dr. ${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa'][i % 6]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][i % 5]}`,
        department: departments[i % departments.length],
        is_active: true
    }));
    
    // Sample patients data
    hospitalData.patients = Array.from({length: 5000}, (_, i) => ({
        patient_id: `PAT_${String(i + 1).padStart(6, '0')}`,
        name: `Patient ${i + 1}`,
        registration_date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T00:00:00.000Z`
    }));
    
    // Sample visits data with proper departments and dates
    hospitalData.visits = Array.from({length: 15000}, (_, i) => {
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const cost = 500 + Math.random() * 10000;
        
        return {
            visit_id: `VISIT_${i + 1}`,
            patient_id: `PAT_${String(Math.floor(Math.random() * 5000) + 1).padStart(6, '0')}`,
            doctor_id: `DOC_${String(Math.floor(Math.random() * 150) + 1).padStart(4, '0')}`,
            department: departments[Math.floor(Math.random() * departments.length)],
            visit_date: `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
            visit_type: ['Outpatient', 'Inpatient', 'Emergency', 'Surgery'][Math.floor(Math.random() * 4)],
            total_cost: cost,
            status: 'Completed',
            length_of_stay: Math.floor(Math.random() * 15),
            readmission_30_days: Math.random() < 0.1
        };
    });
    
    // Sample quality data
    hospitalData.quality = [];
    for (let month = 1; month <= 12; month++) {
        departments.forEach(dept => {
            hospitalData.quality.push({
                year: 2024,
                month: month,
                department: dept,
                patient_satisfaction_score: 7.5 + Math.random() * 2
            });
        });
    }
    
    // Sample performance data
    hospitalData.performance = Array.from({length: 120}, (_, i) => ({
        doctor_id: `DOC_${String(i + 1).padStart(4, '0')}`,
        name: `Dr. ${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa'][i % 6]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][i % 5]}`,
        department: departments[i % departments.length],
        performance_rating: 3 + Math.random() * 2,
        average_patient_satisfaction: 7 + Math.random() * 2.5,
        overtime_hours_monthly: Math.floor(Math.random() * 40)
    }));
    
    console.log('✅ Sample data generated successfully!');
}

// Initialize data loading
loadExcelDataFromStorage();

// Hot reload - check for updates every 10 minutes
setInterval(async () => {
    console.log('🔄 Hot reload: Checking for updated data...');
    await loadExcelDataFromStorage();
}, 600000); // 10 minutes

// =================================================================
// API ROUTES FOR DASHBOARD DATA
// =================================================================

// Dashboard Overview API
app.get('/api/dashboard/overview', (req, res) => {
    try {
        const currentYear = 2024;
        
        // Calculate key metrics
        const totalDoctors = hospitalData.doctors.filter(d => d.is_active !== false).length;
        const totalPatients = hospitalData.patients.length;
        const totalVisits2024 = hospitalData.visits.filter(v => {
            const visitDate = new Date(v.visit_date);
            return visitDate.getFullYear() === currentYear;
        }).length;
        
        // Latest financial data
        const latestFinancial = hospitalData.financial
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || {};
        
        const overview = {
            hospitalInfo: {
                name: "Renova Hospitals",
                founded: "1985",
                beds: 450,
                departments: 12,
                accreditation: "Joint Commission Accredited"
            },
            keyMetrics: {
                totalDoctors,
                totalPatients,
                totalVisits2024,
                monthlyRevenue: latestFinancial.total_revenue || 0,
                profitMargin: (latestFinancial.profit_margin * 100) || 0,
                bedOccupancy: (latestFinancial.bed_occupancy_rate * 100) || 0
            }
        };
        
        res.json(overview);
    } catch (error) {
        console.error('Error in overview API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Financial Performance API - UPDATED WITH ALL FIXES
app.get('/api/dashboard/financial', (req, res) => {
    try {
        // Process financial data - your data has ISO date strings after conversion
        const financialData = hospitalData.financial
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(record => ({
                month: moment(record.date).format('MMM YYYY'),
                revenue: (record.total_revenue || 0) / 1000000, // Convert to millions
                profit: (record.net_profit || 0) / 1000000,
                profitMargin: ((record.profit_margin || 0) * 100),
                occupancyRate: ((record.bed_occupancy_rate || 0) * 100)
            }));
        
        // Revenue by department - Enhanced with better year filtering
        const departmentRevenue = {};
        console.log('🔍 Debug - Total visits to process:', hospitalData.visits.length);
        
        let processedCount = 0;
        let skippedCount = 0;
        const skipReasons = { noDate: 0, invalidDate: 0, wrongYear: 0, notCompleted: 0 };
        
        hospitalData.visits.forEach(visit => {
            // Check if visit has required data
            if (!visit || !visit.visit_date) {
                skipReasons.noDate++;
                skippedCount++;
                return;
            }
            
            try {
                // Your data comes as ISO strings after conversion
                const visitDate = new Date(visit.visit_date);
                
                if (isNaN(visitDate.getTime())) {
                    skipReasons.invalidDate++;
                    skippedCount++;
                    return;
                }
                
                const visitYear = visitDate.getFullYear();
                
                // Accept visits from 2022, 2023 and 2024 (more inclusive)
                if (visitYear < 2022 || visitYear > 2024) {
                    skipReasons.wrongYear++;
                    skippedCount++;
                    return;
                }
                
                const isCompleted = visit.status === 'Completed' || !visit.status;
                if (!isCompleted) {
                    skipReasons.notCompleted++;
                    skippedCount++;
                    return;
                }
                
                // This visit passes all filters
                processedCount++;
                const dept = visit.department || 'Unknown';
                if (!departmentRevenue[dept]) {
                    departmentRevenue[dept] = { revenue: 0, visits: 0 };
                }
                departmentRevenue[dept].revenue += parseFloat(visit.total_cost || 0);
                departmentRevenue[dept].visits += 1;
                
            } catch (error) {
                skipReasons.invalidDate++;
                skippedCount++;
            }
        });
        
        console.log('🔍 Debug - Processing results:', {
            totalVisits: hospitalData.visits.length,
            processedCount,
            skippedCount,
            skipReasons,
            departmentsFound: Object.keys(departmentRevenue).length,
            departments: Object.keys(departmentRevenue)
        });
        
        const revenueByDept = Object.entries(departmentRevenue)
            .map(([dept, data]) => ({
                department: dept,
                revenue: data.revenue / 1000000, // Convert to millions
                total_visits: data.visits,
                avg_revenue_per_visit: data.visits > 0 ? Math.round(data.revenue / data.visits) : 0,
                revenue_percentage: 0 // Will calculate after we have total
            }))
            .sort((a, b) => b.revenue - a.revenue);
        
        // Calculate revenue percentages
        const totalRevenue = revenueByDept.reduce((sum, dept) => sum + dept.revenue, 0);
        revenueByDept.forEach(dept => {
            dept.revenue_percentage = totalRevenue > 0 ? ((dept.revenue / totalRevenue) * 100).toFixed(1) : '0';
        });
        
        console.log('📊 Financial API Response:', {
            monthlyTrends: financialData.length,
            departments: revenueByDept.length,
            totalRevenue: totalRevenue.toFixed(2),
            sampleDepartments: revenueByDept.slice(0, 3).map(d => d.department)
        });
        
        res.json({
            monthlyTrends: financialData,
            revenueByDepartment: revenueByDept
        });
    } catch (error) {
        console.error('Error in financial API:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Operational Metrics API - UPDATED WITH ALL FIXES
app.get('/api/dashboard/operations', (req, res) => {
    try {
        // Patient throughput by month - Enhanced year filtering
        const monthlyThroughput = {};
        console.log('🔍 Debug - Processing visits for throughput:', hospitalData.visits.length);
        
        hospitalData.visits.forEach(visit => {
            if (!visit || !visit.visit_date) return;
            
            try {
                const visitDate = new Date(visit.visit_date);
                if (isNaN(visitDate.getTime())) return;
                
                const visitYear = visitDate.getFullYear();
                // Accept 2022, 2023 and 2024 data (more inclusive)
                if (visitYear < 2022 || visitYear > 2024) return;
                
                const month = moment(visitDate).format('MMM YYYY');
                if (!monthlyThroughput[month]) {
                    monthlyThroughput[month] = { visits: 0, emergency: 0 };
                }
                monthlyThroughput[month].visits++;
                if (visit.visit_type === 'Emergency') {
                    monthlyThroughput[month].emergency++;
                }
            } catch (error) {
                // Skip invalid dates
            }
        });
        
        const throughputData = Object.entries(monthlyThroughput)
            .map(([month, data]) => ({
                month,
                totalVisits: data.visits,
                emergencyVisits: data.emergency,
                emergencyPercentage: data.visits > 0 ? (data.emergency / data.visits * 100).toFixed(1) : '0'
            }))
            .sort((a, b) => moment(a.month, 'MMM YYYY') - moment(b.month, 'MMM YYYY'));
        
        // Average length of stay by department
        const departmentLOS = {};
        const departmentCounts = {};
        
        hospitalData.visits
            .filter(v => v && (parseFloat(v.length_of_stay) || 0) > 0 && (v.status === 'Completed' || !v.status))
            .forEach(visit => {
                const dept = visit.department || 'Unknown';
                if (!departmentLOS[dept]) {
                    departmentLOS[dept] = 0;
                    departmentCounts[dept] = 0;
                }
                departmentLOS[dept] += parseFloat(visit.length_of_stay) || 0;
                departmentCounts[dept]++;
            });
        
        const avgLOSByDept = Object.entries(departmentLOS)
            .map(([dept, totalLOS]) => ({
                department: dept,
                avgLengthOfStay: departmentCounts[dept] > 0 ? (totalLOS / departmentCounts[dept]).toFixed(1) : '0'
            }))
            .sort((a, b) => parseFloat(b.avgLengthOfStay) - parseFloat(a.avgLengthOfStay));
        
        console.log('📊 Operations API Response:', {
            throughputMonths: throughputData.length,
            totalVisitsProcessed: Object.values(monthlyThroughput).reduce((sum, data) => sum + data.visits, 0),
            departments: avgLOSByDept.length,
            sampleMonths: throughputData.slice(0, 3).map(d => d.month)
        });
        
        res.json({
            monthlyThroughput: throughputData,
            lengthOfStayByDepartment: avgLOSByDept
        });
    } catch (error) {
        console.error('Error in operations API:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Quality Metrics API - UPDATED WITH ALL FIXES
app.get('/api/dashboard/quality', (req, res) => {
    try {
        // Patient satisfaction trends - Enhanced year filtering
        const satisfactionTrends = hospitalData.quality
            .filter(q => q.year >= 2022) // Accept 2022-2024 data
            .reduce((acc, record) => {
                const month = `${record.year}-${String(record.month).padStart(2, '0')}`;
                if (!acc[month]) {
                    acc[month] = { total: 0, count: 0 };
                }
                acc[month].total += record.patient_satisfaction_score || 0;
                acc[month].count++;
                return acc;
            }, {});
        
        const satisfactionData = Object.entries(satisfactionTrends)
            .map(([month, data]) => ({
                month: moment(month).format('MMM YYYY'),
                satisfaction: data.count > 0 ? (data.total / data.count).toFixed(1) : '0'
            }))
            .sort((a, b) => moment(a.month, 'MMM YYYY') - moment(b.month, 'MMM YYYY'));
        
        // Readmission rates by department - Enhanced filtering
        const readmissionData = {};
        const totalDischarges = {};
        
        hospitalData.visits
            .filter(v => ['Inpatient', 'Surgery'].includes(v.visit_type) && (v.status === 'Completed' || !v.status))
            .forEach(visit => {
                const dept = visit.department || 'Unknown';
                if (!readmissionData[dept]) {
                    readmissionData[dept] = 0;
                    totalDischarges[dept] = 0;
                }
                totalDischarges[dept]++;
                if (visit.readmission_30_days) {
                    readmissionData[dept]++;
                }
            });
        
        const readmissionRates = Object.entries(readmissionData)
            .map(([dept, readmissions]) => ({
                department: dept,
                readmissionRate: totalDischarges[dept] > 0 ? ((readmissions / totalDischarges[dept]) * 100).toFixed(1) : '0'
            }))
            .sort((a, b) => parseFloat(b.readmissionRate) - parseFloat(a.readmissionRate));
        
        console.log('📊 Quality API Response:', {
            satisfactionTrends: satisfactionData.length,
            readmissionRates: readmissionRates.length,
            sampleSatisfaction: satisfactionData.slice(0, 3)
        });
        
        res.json({
            satisfactionTrends: satisfactionData,
            readmissionRates: readmissionRates
        });
    } catch (error) {
        console.error('Error in quality API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Staff Performance API
app.get('/api/dashboard/staff', (req, res) => {
    try {
        // Performance by department
        const deptPerformance = {};
        
        hospitalData.performance.forEach(staff => {
            if (!deptPerformance[staff.department]) {
                deptPerformance[staff.department] = {
                    totalStaff: 0,
                    totalRating: 0,
                    totalSatisfaction: 0,
                    totalOvertime: 0
                };
            }
            
            const dept = deptPerformance[staff.department];
            dept.totalStaff++;
            dept.totalRating += staff.performance_rating || 0;
            dept.totalSatisfaction += staff.average_patient_satisfaction || 0;
            dept.totalOvertime += staff.overtime_hours_monthly || 0;
        });
        
        const performanceByDept = Object.entries(deptPerformance)
            .map(([dept, data]) => ({
                department: dept,
                avgPerformanceRating: data.totalStaff > 0 ? (data.totalRating / data.totalStaff).toFixed(1) : '0',
                avgPatientSatisfaction: data.totalStaff > 0 ? (data.totalSatisfaction / data.totalStaff).toFixed(1) : '0',
                avgMonthlyOvertime: data.totalStaff > 0 ? (data.totalOvertime / data.totalStaff).toFixed(1) : '0',
                staffCount: data.totalStaff
            }))
            .sort((a, b) => parseFloat(b.avgPerformanceRating) - parseFloat(a.avgPerformanceRating));
        
        res.json({
            performanceByDepartment: performanceByDept
        });
    } catch (error) {
        console.error('Error in staff API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Strategic Metrics API - UPDATED WITH ALL FIXES
app.get('/api/dashboard/strategic', (req, res) => {
    try {
        // New patient acquisition by month - Enhanced filtering
        const monthlyAcquisition = {};
        let processedPatients = 0;
        
        hospitalData.patients
            .filter(p => {
                if (!p.registration_date) return false;
                const regDate = new Date(p.registration_date);
                const year = regDate.getFullYear();
                return year >= 2022 && year <= 2024; // Accept 2022-2024
            })
            .forEach(patient => {
                processedPatients++;
                const month = moment(patient.registration_date).format('MMM YYYY');
                if (!monthlyAcquisition[month]) {
                    monthlyAcquisition[month] = 0;
                }
                monthlyAcquisition[month]++;
            });
        
        const acquisitionData = Object.entries(monthlyAcquisition)
            .map(([month, count]) => ({ month, newPatients: count }))
            .sort((a, b) => moment(a.month, 'MMM YYYY') - moment(b.month, 'MMM YYYY'));
        
        // Insurance mix - Calculate from actual patient data
        const insuranceMix = {};
        hospitalData.patients.forEach(patient => {
            const provider = patient.insurance_provider || 'Unknown';
            if (!insuranceMix[provider]) {
                insuranceMix[provider] = 0;
            }
            insuranceMix[provider]++;
        });
        
        const insuranceData = Object.entries(insuranceMix)
            .map(([provider, count]) => ({
                provider,
                count,
                percentage: ((count / hospitalData.patients.length) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count);
        
        console.log('📊 Strategic API Response:', {
            acquisitionMonths: acquisitionData.length,
            processedPatients,
            insuranceProviders: insuranceData.length,
            sampleAcquisition: acquisitionData.slice(0, 3)
        });
        
        res.json({
            patientAcquisition: acquisitionData,
            insuranceMix: insuranceData
        });
    } catch (error) {
        console.error('Error in strategic API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =================================================================
// APPOINTMENT BOOKING ROUTES
// =================================================================

// Book a new appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const appointmentData = {
            id: 'APT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            ...req.body,
            createdAt: new Date().toISOString(),
            status: 'scheduled'
        };

        console.log('📅 New appointment booking:', appointmentData);

        // In a real implementation, you would:
        // 1. Save to database
        // 2. Send confirmation email
        // 3. Update doctor schedules
        // 4. Send SMS notification

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({
            success: true,
            appointment: appointmentData,
            message: 'Appointment booked successfully! You will receive a confirmation email shortly.'
        });

    } catch (error) {
        console.error('❌ Appointment booking error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to book appointment. Please try again.' 
        });
    }
});

// Get available time slots
app.get('/api/appointments/slots/:department/:date', async (req, res) => {
    try {
        const { department, date } = req.params;
        
        // Simulate getting available slots from database
        const allSlots = [
            '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
            '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
            '5:00 PM', '5:30 PM', '6:00 PM'
        ];

        // Randomly make some slots unavailable (simulate real bookings)
        const availableSlots = allSlots.map(time => ({
            time,
            available: Math.random() > 0.3,
            doctorName: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][Math.floor(Math.random() * 5)]}`
        }));

        console.log(`📅 Available slots requested for ${department} on ${date}`);

        res.json({
            success: true,
            department,
            date,
            slots: availableSlots
        });

    } catch (error) {
        console.error('❌ Error fetching time slots:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch available time slots' 
        });
    }
});

// Get appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Simulate database lookup
        const appointment = {
            id,
            patientName: 'John Doe',
            department: 'Cardiology',
            date: '2024-01-15',
            time: '10:00 AM',
            doctor: 'Dr. Smith',
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };

        res.json({
            success: true,
            appointment
        });

    } catch (error) {
        console.error('❌ Error fetching appointment:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Appointment not found' 
        });
    }
});

// Cancel appointment
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Cancelling appointment: ${id}`);
        
        // Simulate cancellation process
        await new Promise(resolve => setTimeout(resolve, 500));

        res.json({
            success: true,
            message: 'Appointment cancelled successfully'
        });

    } catch (error) {
        console.error('❌ Error cancelling appointment:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to cancel appointment' 
        });
    }
});

// Get department information
app.get('/api/departments', (req, res) => {
    try {
        const departments = [
            {
                id: 'cardiology',
                name: 'Cardiology',
                description: 'Heart and cardiovascular care',
                icon: 'fas fa-heartbeat',
                doctors: ['Dr. Smith', 'Dr. Johnson'],
                availableHours: '8:00 AM - 6:00 PM'
            },
            {
                id: 'neurology',
                name: 'Neurology',
                description: 'Brain and nervous system care',
                icon: 'fas fa-brain',
                doctors: ['Dr. Williams', 'Dr. Brown'],
                availableHours: '9:00 AM - 5:00 PM'
            },
            {
                id: 'orthopedics',
                name: 'Orthopedics',
                description: 'Bone, joint, and muscle care',
                icon: 'fas fa-bone',
                doctors: ['Dr. Davis', 'Dr. Miller'],
                availableHours: '8:00 AM - 7:00 PM'
            },
            {
                id: 'emergency',
                name: 'Emergency Medicine',
                description: '24/7 emergency care',
                icon: 'fas fa-ambulance',
                doctors: ['Emergency Team'],
                availableHours: '24/7'
            },
            {
                id: 'internal',
                name: 'Internal Medicine',
                description: 'Primary care and internal medicine',
                icon: 'fas fa-user-md',
                doctors: ['Dr. Wilson', 'Dr. Moore'],
                availableHours: '8:00 AM - 6:00 PM'
            },
            {
                id: 'pediatrics',
                name: 'Pediatrics',
                description: 'Specialized care for children',
                icon: 'fas fa-baby',
                doctors: ['Dr. Taylor', 'Dr. Anderson'],
                availableHours: '8:00 AM - 6:00 PM'
            }
        ];

        res.json({
            success: true,
            departments
        });

    } catch (error) {
        console.error('❌ Error fetching departments:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch departments' 
        });
    }
});

// =================================================================
// FIREBASE STORAGE & FILE UPLOAD ROUTES
// =================================================================

// Upload Excel file to Firebase Storage
app.post('/api/upload-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('📤 Uploading Excel file to Firebase Storage...');
        const bucket = admin.storage().bucket();
        const file = bucket.file('hospital_data.xlsx');

        // Create a write stream to Firebase Storage
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
                metadata: {
                    uploadedAt: new Date().toISOString(),
                    originalName: req.file.originalname
                }
            }
        });

        stream.on('error', (err) => {
            console.error('❌ Upload error:', err);
            res.status(500).json({ error: 'Failed to upload file' });
        });

        stream.on('finish', async () => {
            console.log('✅ File uploaded successfully to Firebase Storage');
            
            // Reload data from the newly uploaded file
            await loadExcelDataFromStorage();
            
            res.json({ 
                message: 'File uploaded and data reloaded successfully',
                timestamp: new Date().toISOString()
            });
        });

        stream.end(req.file.buffer);

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Manual reload data endpoint
app.post('/api/reload-data', async (req, res) => {
    try {
        console.log('🔄 Manual data reload requested...');
        await loadExcelDataFromStorage();
        res.json({ 
            message: 'Data reloaded successfully',
            timestamp: new Date().toISOString(),
            dataStatus: {
                doctors: hospitalData.doctors.length,
                patients: hospitalData.patients.length,
                visits: hospitalData.visits.length,
                financial: hospitalData.financial.length,
                quality: hospitalData.quality.length,
                performance: hospitalData.performance.length
            }
        });
    } catch (error) {
        console.error('❌ Reload error:', error);
        res.status(500).json({ error: 'Failed to reload data', details: error.message });
    }
});

// Get current data status
app.get('/api/data-status', (req, res) => {
    res.json({
        dataStatus: {
            doctors: hospitalData.doctors.length,
            patients: hospitalData.patients.length,
            visits: hospitalData.visits.length,
            financial: hospitalData.financial.length,
            quality: hospitalData.quality.length,
            performance: hospitalData.performance.length
        },
        lastUpdated: new Date().toISOString()
    });
});

// =================================================================
// STATIC FILE ROUTES
// =================================================================

// Serve the main dashboard page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/appointments', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'appointments.html'));
});

// =================================================================
// START SERVER
// =================================================================

app.listen(PORT, () => {
    console.log(`
🏥 ====================================
   RENOVA HOSPITALS DASHBOARD
====================================
🚀 Server running on http://localhost:${PORT}
📊 Dashboard: http://localhost:${PORT}/dashboard
📁 Excel file path: ./public/data/hospital_data.xlsx
====================================
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Renova Hospitals Dashboard...');
    process.exit(0);
});

module.exports = app;