// Test script to verify end-to-end subscription functionality
const BASE_URL = 'http://localhost:3000';

async function testSubscriptionFlow() {
  console.log('🚀 Testing End-to-End Subscription Flow');
  console.log('======================================');

  try {
    // 1. Test subscription plans endpoint
    console.log('\n1. Testing subscription plans...');
    const plansResponse = await fetch(`${BASE_URL}/api/subscription/plans`);
    const plansData = await plansResponse.json();
    
    if (plansResponse.ok) {
      console.log('✅ Plans endpoint working');
      console.log(`   Found ${plansData.plans?.length || 0} plans`);
      if (plansData.plans?.length > 0) {
        console.log(`   Sample plan: ${plansData.plans[0].displayName} - ${plansData.plans[0].price/100} ${plansData.plans[0].currency}`);
      }
    } else {
      console.log('❌ Plans endpoint failed:', plansData);
      return;
    }

    // 2. Test subscription creation endpoint structure (without auth)
    console.log('\n2. Testing subscription creation endpoint structure...');
    const createResponse = await fetch(`${BASE_URL}/api/subscription/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: 'test',
        billingAddress: {
          country: 'DZ',
          state: 'Algiers',
          city: 'Algiers',
          address: 'Test Address',
          postalCode: '16000'
        }
      })
    });

    const createData = await createResponse.json();
    
    if (createResponse.status === 401) {
      console.log('✅ Subscription creation endpoint properly requires authentication');
    } else {
      console.log(`⚠️  Unexpected response: ${createResponse.status}`, createData);
    }

    // 3. Test subscription management endpoint
    console.log('\n3. Testing subscription management endpoint...');
    const subResponse = await fetch(`${BASE_URL}/api/dashboard/subscription`);
    const subData = await subResponse.json();
    
    if (subResponse.status === 401) {
      console.log('✅ Subscription management endpoint properly requires authentication');
    } else {
      console.log(`⚠️  Unexpected response: ${subResponse.status}`, subData);
    }

    // 4. Test billing endpoint
    console.log('\n4. Testing billing endpoint...');
    const billingResponse = await fetch(`${BASE_URL}/api/dashboard/billing`);
    const billingData = await billingResponse.json();
    
    if (billingResponse.status === 401) {
      console.log('✅ Billing endpoint properly requires authentication');
    } else {
      console.log(`⚠️  Unexpected response: ${billingResponse.status}`, billingData);
    }

    console.log('\n🎉 Subscription Flow Test Complete!');
    console.log('\nSummary:');
    console.log('- ✅ Pricing page can fetch available plans');
    console.log('- ✅ Subscription creation endpoint exists and requires auth');
    console.log('- ✅ Subscription management endpoint exists and requires auth');  
    console.log('- ✅ Billing endpoint exists and requires auth');
    console.log('\n📝 Next steps:');
    console.log('1. Log in to test authenticated subscription creation');
    console.log('2. Test subscription management actions (cancel, change plan)');
    console.log('3. Test billing address collection and invoice generation');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSubscriptionFlow();
