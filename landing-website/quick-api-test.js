/**
 * Quick Dashboard API Test
 * Simple test to verify all dashboard endpoints are responding
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ENDPOINTS = [
  '/api/dashboard/stats',
  '/api/dashboard/activity', 
  '/api/dashboard/users',
  '/api/dashboard/addons',
  '/api/dashboard/billing',
  '/api/dashboard/subscription'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(`${BASE_URL}${endpoint}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          endpoint,
          status: res.statusCode,
          duration,
          success: res.statusCode === 200 || res.statusCode === 401,
          response: body.length > 0 ? body.substring(0, 100) + '...' : 'No response'
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 'ERROR',
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 'TIMEOUT',
        duration: 5000,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runQuickTest() {
  console.log('🧪 Quick Dashboard API Test');
  console.log('============================');
  console.log(`Server: ${BASE_URL}`);
  console.log('');

  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.status} (${result.duration}ms)`);
    } else {
      console.log(`❌ ${result.status} (${result.error || 'Failed'})`);
    }
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
  console.log(`📈 Total: ${results.length}`);

  // Show any failures
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('');
    console.log('❌ Failures:');
    failures.forEach(f => {
      console.log(`  ${f.endpoint}: ${f.error || f.status}`);
    });
  }

  console.log('');
  console.log('ℹ️  Note: 401 status codes are expected (authentication required)');
}

runQuickTest().catch(console.error);
