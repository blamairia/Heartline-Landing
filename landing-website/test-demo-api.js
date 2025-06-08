// Test script for demo API endpoint
const testDemoAPI = async () => {
  const testData = {
    firstName: "John",
    lastName: "Smith", 
    email: "blamairia@gmail.com",
    phone: "+1-555-0123",
    jobTitle: "IT Director",
    organizationName: "Test Healthcare System",
    organizationType: "Hospital",
    organizationSize: "500-1000 employees",
    currentECGSystem: "Legacy System X",
    primaryUseCase: "AI-powered ECG analysis",
    interestedFeatures: ["Real-time analysis", "Automated reporting", "Integration capabilities"],
    timeframe: "Within 2 weeks",
    preferredDemoType: "Virtual demo",
    additionalRequirements: "Need integration with existing PACS system",
    country: "United States"
  };

  try {
    console.log('Testing Demo API...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Response body:', responseData);
    
    if (response.ok) {
      console.log('✅ Demo API test PASSED!');
      try {
        const jsonData = JSON.parse(responseData);
        console.log('Parsed response:', jsonData);
      } catch (e) {
        console.log('Response is not JSON');
      }
    } else {
      console.log('❌ Demo API test FAILED!');
    }
  } catch (error) {
    console.error('❌ Demo API test ERROR:', error);
  }
};

testDemoAPI();
