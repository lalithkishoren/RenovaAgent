# Renova Hospitals Executive Dashboard

A comprehensive healthcare analytics dashboard built with Node.js, Express, and Firebase, featuring dynamic Excel data integration and real-time chart visualization.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange) ![Chart.js](https://img.shields.io/badge/Chart.js-3.9.1-blue)

## 🚀 Features

### 📊 **Interactive Dashboard**
- **Real-time KPI Cards** - Revenue, profit margin, bed occupancy, patient satisfaction
- **Dynamic Charts** - Financial trends, occupancy rates, patient throughput, satisfaction metrics
- **Department Analytics** - Revenue breakdown and performance by department
- **Responsive Design** - Works seamlessly on desktop and mobile

### ☁️ **Firebase Storage Integration**
- **Hot Reload** - Data automatically refreshes every 10 minutes
- **Cloud-based Excel Files** - Upload and manage hospital data via Firebase Storage
- **Automatic Fallback** - Local file backup if cloud storage unavailable
- **No Redeployment Required** - Update charts by simply uploading new Excel files

### 🔄 **Dynamic Data Management**
- **File Upload API** - Programmatic Excel file uploads
- **Manual Reload** - Force immediate data refresh
- **Data Status Monitoring** - Real-time data health checks
- **Multi-sheet Excel Support** - Handles complex hospital data structures

## 🏥 **Dashboard Sections**

1. **Financial Performance**
   - Monthly revenue and profit trends
   - Department revenue breakdown
   - Profit margin analysis

2. **Operational Metrics**
   - Patient throughput analysis
   - Bed occupancy tracking
   - Length of stay by department

3. **Quality Metrics**
   - Patient satisfaction trends
   - Readmission rates by department

4. **Staff Performance**
   - Performance ratings by department
   - Overtime tracking
   - Staff count analytics

5. **Strategic Insights**
   - Patient acquisition trends
   - Insurance mix analysis

## 🛠️ **Tech Stack**

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js 3.9.1
- **Cloud**: Firebase (Storage, App Hosting)
- **Data Processing**: XLSX.js for Excel file handling
- **File Upload**: Multer middleware
- **Date Handling**: Moment.js

## 📋 **Prerequisites**

- Node.js 18+
- Firebase CLI
- Firebase project with Storage enabled
- Excel file with hospital data (see format below)

## 🚀 **Quick Start**

### 1. **Clone Repository**
```bash
git clone https://github.com/lalithkishoren/RenovaAgent.git
cd RenovaAgent
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Firebase Setup**
```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase use --add codecanyon-landing
```

### 4. **Start Development Server**
```bash
npm run dev
# or
node server.js
```

### 5. **Access Dashboard**
- Local: http://localhost:3000/dashboard
- Live: Your Firebase App Hosting URL

## 📁 **Excel Data Format**

Your Excel file should contain these sheets:

### **Required Sheets:**
1. `hospital_doctors` - Doctor information
2. `hospital_patients` - Patient records  
3. `hospital_patient_visits` - Visit data
4. `hospital_financial_metrics` - Financial data
5. `hospital_quality_metrics` - Quality metrics
6. `hospital_staff_performance` - Staff performance data

### **Sample Data Structure:**
```
hospital_financial_metrics:
- date (Excel date format)
- total_revenue (number)
- net_profit (number) 
- profit_margin (decimal)
- bed_occupancy_rate (decimal)

hospital_patient_visits:
- visit_date (Excel date format)
- department (string)
- total_cost (number)
- visit_type (Outpatient/Inpatient/Emergency/Surgery)
- status (Completed/Pending)
```

## 🔄 **Updating Dashboard Data**

### **Method 1: Firebase Console (Manual)**
1. Go to [Firebase Console Storage](https://console.firebase.google.com)
2. Upload new `hospital_data.xlsx` file
3. Charts update automatically within 10 minutes

### **Method 2: API Upload**
```bash
curl -X POST http://localhost:3000/api/upload-excel \
  -F "excelFile=@path/to/your/hospital_data.xlsx"
```

### **Method 3: Manual Reload**
```bash
curl -X POST http://localhost:3000/api/reload-data
```

## 📡 **API Endpoints**

### **Dashboard Data**
- `GET /api/dashboard/overview` - Hospital overview and KPIs
- `GET /api/dashboard/financial` - Financial metrics and trends  
- `GET /api/dashboard/operations` - Operational metrics
- `GET /api/dashboard/quality` - Quality and satisfaction metrics
- `GET /api/dashboard/staff` - Staff performance data
- `GET /api/dashboard/strategic` - Strategic insights

### **Data Management**
- `POST /api/upload-excel` - Upload new Excel file
- `POST /api/reload-data` - Force data reload
- `GET /api/data-status` - Check current data status

## 🚀 **Deployment**

### **Firebase Deployment**
```bash
# Deploy to Firebase
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only apphosting
```

### **Environment Variables**
The app automatically uses Firebase Application Default Credentials in production.

## 🔧 **Configuration**

### **Hot Reload Interval**
Edit `server.js` line 298-301 to change refresh frequency:
```javascript
setInterval(async () => {
    await loadExcelDataFromStorage();
}, 600000); // 10 minutes (600000ms)
```

### **File Upload Limits**
Modify `server.js` line 39-41:
```javascript
limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
}
```

## 📊 **Dashboard Features**

- ✅ **Auto-refresh** every 5 minutes
- ✅ **Hot reload** for data updates  
- ✅ **Responsive charts** that adapt to screen size
- ✅ **Error handling** with fallback data
- ✅ **Loading states** for better UX
- ✅ **Excel date conversion** automatically handled

## 🛡️ **Security Features**

- File upload validation (Excel files only)
- Firebase security rules
- Error handling without data exposure
- Sanitized API responses

## 📈 **Performance**

- **Firebase CDN** for global content delivery
- **Efficient data processing** with streaming
- **Minimal client-side JavaScript** for fast loading
- **Chart.js optimization** for smooth animations

## 🐛 **Troubleshooting**

### **Charts not updating?**
1. Check Firebase Storage for uploaded file
2. Call `/api/data-status` to verify data load
3. Check browser console for JavaScript errors

### **Excel file not processing?**
1. Ensure sheet names match requirements exactly
2. Verify date columns are in Excel date format
3. Check file size (must be under 10MB)

### **Firebase connection issues?**
1. Verify Firebase CLI login: `firebase login --reauth`
2. Check project configuration: `firebase use --add`
3. Ensure Firebase Storage rules allow read/write

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Chart.js for excellent charting library
- Firebase for reliable cloud infrastructure  
- XLSX.js for Excel file processing
- Express.js for robust web framework

## 📞 **Support**

For support and questions:
- 📧 Open an issue on GitHub
- 📚 Check the [API Documentation](#-api-endpoints)
- 🔍 Review [Troubleshooting](#-troubleshooting) section

---

**Built with ❤️ for healthcare analytics**

🤖 *Generated with [Claude Code](https://claude.ai/code)*