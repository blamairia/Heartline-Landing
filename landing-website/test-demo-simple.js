const testData = {
  firstName: "John",
  lastName: "Doe",
  email: "your-email@gmail.com", // Replace with your actual email
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

fetch('http://localhost:3000/api/demo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
.then(response => response.json())
.then(data => {
  console.log('✅ Success:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
