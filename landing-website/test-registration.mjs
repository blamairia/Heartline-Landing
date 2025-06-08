import fetch from 'node-fetch';

// Test registration API
const testRegistration = async () => {
  console.log('🧪 Testing registration API...');
  
  const testUser = {
    email: "test@example.com",
    password: "testpassword123",
    firstName: "Test",
    lastName: "User",
    organizationName: "Test Hospital",
    role: "cardiologist",
    organizationType: "hospital",
    organizationSize: "100-500",
    specialties: ["cardiology"],
    country: "US",
    phone: "+1234567890"
  };

  try {
    console.log('📤 Sending request to API...');
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const result = await response.json();
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', result);

    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('👤 User ID:', result.userId);
    } else {
      console.log('❌ Registration failed:', result.message);
      if (result.errors) {
        console.log('🔍 Validation errors:', result.errors);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Run the test
testRegistration().catch(console.error);
