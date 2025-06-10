// Test subscription creation flow
const BASE_URL = 'http://localhost:3000';

async function testSubscriptionCreation() {
  console.log('🚀 Testing Subscription Creation Flow');
  console.log('=====================================');

  try {
    // 1. Test plans endpoint
    console.log('\n1. Fetching available plans...');
    const plansResponse = await fetch(`${BASE_URL}/api/subscription/plans`);
    const plansData = await plansResponse.json();
    
    if (plansResponse.ok) {
      console.log('✅ Plans endpoint working');
      console.log(`   Found ${plansData.plans?.length || 0} plans:`);
      plansData.plans?.forEach(plan => {
        console.log(`   - ${plan.name}: ${plan.displayName} (${plan.price/100} ${plan.currency})`);
      });
    } else {
      console.log('❌ Plans endpoint failed:', plansData);
      return;
    }

    // 2. Test subscription creation (without authentication - should fail)
    console.log('\n2. Testing subscription creation without auth...');
    const createResponse = await fetch(`${BASE_URL}/api/subscription/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'professional',
        billingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '123456789',
          organization: 'Test Org',
          address: 'Test Address',
          city: 'Test City',
          wilaya: 'Test Wilaya'
        }
      })
    });

    const createData = await createResponse.json();
    
    if (createResponse.status === 401) {
      console.log('✅ Subscription creation properly requires authentication');
    } else {
      console.log(`⚠️  Unexpected response: ${createResponse.status}`, createData);
    }

    console.log('\n🎉 Subscription Creation Test Complete!');
    console.log('\nTo test with authentication:');
    console.log('1. Go to http://localhost:3000/auth/login');
    console.log('2. Login with: demo@Heartline.com / demo123');
    console.log('3. Go to http://localhost:3000/dashboard/pricing');
    console.log('4. Select a plan and fill in billing details');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (typeof module === 'undefined') {
  testSubscriptionCreation();
} else {
  module.exports = { testSubscriptionCreation };
}
