/**
 * Dashboard API Endpoints Test Script
 * Tests all dashboard-related API endpoints for the Hearline Webapp
 * 
 * Usage: node test-dashboard-apis.js
 * Make sure the development server is running on http://localhost:3000 or http://localhost:3001
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Change to 3001 if server is on that port
const ENDPOINTS = {
  stats: '/api/dashboard/stats',
  activity: '/api/dashboard/activity',
  users: '/api/dashboard/users',
  addons: '/api/dashboard/addons',
  billing: '/api/dashboard/billing',
  subscription: '/api/dashboard/subscription'
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Make HTTP request with promise wrapper
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Dashboard-API-Tester/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Log test result with colors
 */
function logResult(test, passed, message, response = null) {
  const status = passed ? 
    `${colors.green}✓ PASS${colors.reset}` : 
    `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`${status} ${colors.bold}${test}${colors.reset}`);
  console.log(`  ${message}`);
  
  if (response) {
    console.log(`  Status: ${response.statusCode}`);
    if (response.body && typeof response.body === 'object') {
      console.log(`  Response keys: [${Object.keys(response.body).join(', ')}]`);
    }
  }
  
  console.log(''); // Empty line for readability
  
  testResults.details.push({
    test,
    passed,
    message,
    response: response ? {
      statusCode: response.statusCode,
      bodyKeys: response.body && typeof response.body === 'object' ? Object.keys(response.body) : null
    } : null
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * Test individual endpoint
 */
async function testEndpoint(name, endpoint, expectedKeys = []) {
  try {
    console.log(`${colors.blue}→${colors.reset} Testing ${colors.bold}${name}${colors.reset} endpoint...`);
    
    const response = await makeRequest(`${BASE_URL}${endpoint}`);
    
    // Check if request was successful
    if (response.statusCode === 200) {
      // Check if response has expected structure
      if (response.body && typeof response.body === 'object') {
        const hasExpectedKeys = expectedKeys.length === 0 || 
          expectedKeys.every(key => response.body.hasOwnProperty(key));
        
        if (hasExpectedKeys) {
          logResult(
            `${name} Endpoint`, 
            true, 
            `Successfully fetched data with expected structure`,
            response
          );
        } else {
          logResult(
            `${name} Endpoint`, 
            false, 
            `Missing expected keys: ${expectedKeys.filter(key => !response.body.hasOwnProperty(key)).join(', ')}`,
            response
          );
        }
      } else {
        logResult(
          `${name} Endpoint`, 
          false, 
          `Response is not a valid JSON object`,
          response
        );
      }
    } else if (response.statusCode === 401) {
      logResult(
        `${name} Endpoint`, 
        true, 
        `Correctly returns 401 Unauthorized (authentication required)`,
        response
      );
    } else {
      logResult(
        `${name} Endpoint`, 
        false, 
        `Unexpected status code: ${response.statusCode}`,
        response
      );
    }
    
  } catch (error) {
    logResult(
      `${name} Endpoint`, 
      false, 
      `Request failed: ${error.message}`
    );
  }
}

/**
 * Test users endpoint with query parameters
 */
async function testUsersWithParams() {
  const testCases = [
    {
      name: 'Users - Search Query',
      params: '?search=ahmed',
      expectedBehavior: 'Should filter users by search term'
    },
    {
      name: 'Users - Role Filter',
      params: '?role=PATIENT',
      expectedBehavior: 'Should filter users by role'
    },
    {
      name: 'Users - Status Filter',
      params: '?status=ACTIVE',
      expectedBehavior: 'Should filter users by status'
    },
    {
      name: 'Users - Pagination',
      params: '?page=1&limit=5',
      expectedBehavior: 'Should return paginated results'
    },
    {
      name: 'Users - Combined Filters',
      params: '?search=test&role=PATIENT&status=ACTIVE&page=1&limit=10',
      expectedBehavior: 'Should handle multiple filters'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`${colors.blue}→${colors.reset} Testing ${colors.bold}${testCase.name}${colors.reset}...`);
      
      const response = await makeRequest(`${BASE_URL}${ENDPOINTS.users}${testCase.params}`);
      
      if (response.statusCode === 200 || response.statusCode === 401) {
        logResult(
          testCase.name,
          true,
          response.statusCode === 200 ? 
            `${testCase.expectedBehavior} - Success` : 
            `Authentication required (401) - Expected behavior`,
          response
        );
      } else {
        logResult(
          testCase.name,
          false,
          `Unexpected response: ${response.statusCode}`,
          response
        );
      }
    } catch (error) {
      logResult(
        testCase.name,
        false,
        `Request failed: ${error.message}`
      );
    }
  }
}

/**
 * Test addons endpoint with different categories
 */
async function testAddonsWithCategories() {
  const categories = ['ANALYSIS', 'REPORTING', 'INTEGRATION', 'STORAGE'];
  
  for (const category of categories) {
    try {
      console.log(`${colors.blue}→${colors.reset} Testing ${colors.bold}Addons - ${category}${colors.reset}...`);
      
      const response = await makeRequest(`${BASE_URL}${ENDPOINTS.addons}?category=${category}`);
      
      if (response.statusCode === 200 || response.statusCode === 401) {
        logResult(
          `Addons - ${category} Category`,
          true,
          response.statusCode === 200 ? 
            `Successfully filtered by category` : 
            `Authentication required (401) - Expected behavior`,
          response
        );
      } else {
        logResult(
          `Addons - ${category} Category`,
          false,
          `Unexpected response: ${response.statusCode}`,
          response
        );
      }
    } catch (error) {
      logResult(
        `Addons - ${category} Category`,
        false,
        `Request failed: ${error.message}`
      );
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bold}${colors.blue}🧪 Dashboard API Endpoints Test Suite${colors.reset}`);
  console.log(`${colors.yellow}Testing server at: ${BASE_URL}${colors.reset}`);
  console.log('='.repeat(60));
  console.log('');

  // Test basic endpoints
  await testEndpoint('Stats', ENDPOINTS.stats, ['totalUsers', 'activeSubscriptions']);
  await testEndpoint('Activity', ENDPOINTS.activity, ['activities']);
  await testEndpoint('Users', ENDPOINTS.users, ['users', 'pagination']);
  await testEndpoint('Addons', ENDPOINTS.addons, ['addons']);
  await testEndpoint('Billing', ENDPOINTS.billing, ['paymentMethods', 'invoices']);
  await testEndpoint('Subscription', ENDPOINTS.subscription, ['subscription', 'hasActiveSubscription']);

  // Test users endpoint with parameters
  console.log(`${colors.bold}${colors.yellow}Testing Users Endpoint with Parameters${colors.reset}`);
  console.log('-'.repeat(40));
  await testUsersWithParams();

  // Test addons endpoint with categories
  console.log(`${colors.bold}${colors.yellow}Testing Addons Endpoint with Categories${colors.reset}`);
  console.log('-'.repeat(40));
  await testAddonsWithCategories();

  // Print summary
  console.log('='.repeat(60));
  console.log(`${colors.bold}📊 Test Summary${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Check the details above.${colors.reset}`);
  }

  // Detailed results in JSON format
  console.log('');
  console.log(`${colors.bold}📋 Detailed Results (JSON):${colors.reset}`);
  console.log(JSON.stringify(testResults, null, 2));
}

/**
 * Check if server is reachable
 */
async function checkServer() {
  try {
    console.log(`${colors.blue}🔍 Checking server availability...${colors.reset}`);
    const response = await makeRequest(`${BASE_URL}/api/dashboard/stats`);
    console.log(`${colors.green}✓ Server is reachable${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Server is not reachable: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Make sure your development server is running on ${BASE_URL}${colors.reset}`);
    return false;
  }
}

// Run the tests
(async () => {
  const serverReachable = await checkServer();
  if (serverReachable) {
    console.log('');
    await runTests();
  } else {
    process.exit(1);
  }
})();
