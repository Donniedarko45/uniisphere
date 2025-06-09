// Simple CORS test script
// Run this with: node test-cors.js

const https = require('https');
const http = require('http');

const testCORS = async (origin) => {
  console.log(`\n🧪 Testing CORS for origin: ${origin}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'uniisphere-backend-latest.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log('CORS Headers received:');
      console.log(`  Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
      console.log(`  Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
      console.log(`  Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
      
      if (res.statusCode === 200 && res.headers['access-control-allow-origin']) {
        console.log('✅ CORS test PASSED');
        resolve(true);
      } else {
        console.log('❌ CORS test FAILED');
        resolve(false);
      }
    });

    req.on('error', (e) => {
      console.error(`❌ Request failed: ${e.message}`);
      resolve(false);
    });

    req.end();
  });
};

const runTests = async () => {
  console.log('🚀 Starting CORS tests...');
  
  const testOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://chrome-extension://mock',
    'https://example.com' // This should fail
  ];

  for (const origin of testOrigins) {
    await testCORS(origin);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n🎯 Test completed!');
  console.log('If localhost:5173 shows ✅ PASSED, your CORS fix is working!');
};

runTests(); 