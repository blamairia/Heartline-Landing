/**
 * Test dashboard APIs with session authentication
 * Usage: node test-with-session.js YOUR_SESSION_TOKEN
 */

const http = require('http');

const SESSION_TOKEN = process.argv[2];
const BASE_URL = 'http://localhost:3000';

if (!SESSION_TOKEN) {
  console.log('❌ Please provide session token as argument:');
  console.log('node test-with-session.js YOUR_SESSION_TOKEN');
  process.exit(1);
}

async function testWithAuth(endpoint, name) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET',
      headers: {
        'Cookie': `next-auth.session-token=${SESSION_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log(`✅ ${name}: ${res.statusCode}`);
          console.log(`   Keys: [${Object.keys(data).join(', ')}]`);
          if (data.users) console.log(`   Users count: ${data.users.length}`);
          if (data.activities) console.log(`   Activities count: ${data.activities.length}`);
          resolve(data);
        } catch (e) {
          console.log(`❌ ${name}: Parse error - ${e.message}`);
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing with session authentication...\n');

  const endpoints = [
    ['/api/dashboard/stats', 'Stats'],
    ['/api/dashboard/users', 'Users'],
    ['/api/dashboard/activity', 'Activity'],
    ['/api/dashboard/addons', 'Addons'],
    ['/api/dashboard/subscription', 'Subscription']
  ];

  for (const [endpoint, name] of endpoints) {
    await testWithAuth(endpoint, name);
  }
}

runTests().catch(console.error);