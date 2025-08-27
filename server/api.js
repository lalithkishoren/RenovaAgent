const express = require('express');
const path = require('path');
const app = express();

// Serve static JSON files as API endpoints
app.get('/api/dashboard/overview', (req, res) => {
    res.sendFile(path.join(__dirname, '../data/overview.json'));
});

app.get('/api/dashboard/financial', (req, res) => {
    res.sendFile(path.join(__dirname, '../data/financial.json'));
});

app.get('/api/dashboard/operations', (req, res) => {
    res.sendFile(path.join(__dirname, '../data/operations.json'));
});

app.get('/api/dashboard/quality', (req, res) => {
    res.sendFile(path.join(__dirname, '../data/quality.json'));
});

app.get('/api/dashboard/staff', (req, res) => {
    res.sendFile(path.join(__dirname, '../data/staff.json'));
});

app.get('/api/dashboard/strategic', (req, res) => {
    res.sendFile(path.join(__dirname, '../data/strategic.json'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});