/**
 * Test Attendance Endpoints
 * Quick test to verify attendance system is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        });
        authToken = response.data.token;
        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDashboard() {
    try {
        const response = await axios.get(`${BASE_URL}/attendance/dashboard`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Dashboard endpoint working');
        console.log('Dashboard data:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Dashboard failed:', error.response?.data || error.message);
        console.error('Full error:', error);
        return false;
    }
}

async function testClassAttendance() {
    try {
        const response = await axios.get(`${BASE_URL}/attendance/class/1/date/2026-02-17`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Class attendance endpoint working');
        console.log('Class attendance data:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Class attendance failed:', error.response?.data || error.message);
        console.error('Full error:', error);
        return false;
    }
}

async function runTests() {
    console.log('\n🧪 Testing Attendance Endpoints...\n');

    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without login\n');
        return;
    }

    await testDashboard();
    await testClassAttendance();

    console.log('\n✅ Tests complete\n');
}

runTests();
