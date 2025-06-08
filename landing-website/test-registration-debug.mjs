import fetch from 'node-fetch';

const testRegistration = async () => {
  console.log('Testing registration API...');
  
  const testData = {
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Hospital',
    role: 'cardiologist',
    organizationType: 'hospital',
    organizationSize: '50-100',
    country: 'Algeria',
    phone: '+213123456789'
  };

  try {
    console.log('Sending registration request with data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Registration API responded successfully');
    } else {
      console.log('❌ Registration API failed');
    }
  } catch (error) {
    console.error('❌ Error testing registration:', error);
  }
};

testRegistration();
