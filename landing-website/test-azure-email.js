const { EmailClient } = require("@azure/communication-email");
require("dotenv").config();

// Use your exact connection string
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const emailClient = new EmailClient(connectionString);

async function testEmail() {
    console.log("=== Testing Azure Communication Services Email ===");
    console.log("Connection string endpoint:", connectionString.split(';')[0]);
    
    try {
        // Test with your custom domain first
        const emailMessage = {
            senderAddress: "DoNotReply@heartline.tech",  // Your verified domain
            content: {
                subject: "Test Email - Azure Communication Services",
                plainText: "This is a test email to verify Azure setup.",
                html: `
                <html>
                    <body>
                        <h1>Test Email</h1>
                        <p>This is a test email to verify Azure Communication Services setup.</p>
                        <p>Domain: heartline.tech</p>
                        <p>Sent at: ${new Date().toISOString()}</p>
                    </body>
                </html>`,
            },
            recipients: {
                to: [
                    {
                        address: "blamairia@gmail.com",
                        displayName: "Test Recipient",
                    },
                ],
            },
        };

        console.log("Attempting to send email...");
        console.log("Sender:", emailMessage.senderAddress);
        console.log("Recipient:", emailMessage.recipients.to[0].address);

        const poller = await emailClient.beginSend(emailMessage);

        if (!poller.getOperationState().isStarted) {
            throw new Error("Email poller was not started");
        }

        console.log("Email sending initiated, polling for result...");
        
        const POLLER_WAIT_TIME = 10;
        let timeElapsed = 0;
        
        while (!poller.isDone()) {
            await poller.poll();
            console.log("Email send polling in progress...");

            await new Promise(resolve => setTimeout(resolve, POLLER_WAIT_TIME * 1000));
            timeElapsed += POLLER_WAIT_TIME;

            if (timeElapsed > 18 * POLLER_WAIT_TIME) {
                throw new Error("Polling timed out");
            }
        }

        const result = poller.getResult();
        console.log("=== RESULT ===");
        console.log("Status:", result?.status);
        console.log("ID:", result?.id);
        console.log("Error:", result?.error);
        
        if (result?.status === 'Succeeded') {
            console.log("✅ SUCCESS: Email sent successfully!");
            return true;
        } else {
            console.log("❌ FAILED: Email sending failed");
            console.log("Full result:", JSON.stringify(result, null, 2));
            return false;
        }

    } catch (error) {
        console.log("=== ERROR DETAILS ===");
        console.log("Error name:", error.name);
        console.log("Error code:", error.code);
        console.log("Error message:", error.message);
        console.log("Status code:", error.statusCode);
        
        if (error.details) {
            console.log("Error details:", JSON.stringify(error.details, null, 2));
        }
        
        return false;
    }
}

// Run the test
testEmail().then(success => {
    if (success) {
        console.log("\n🎉 Email test completed successfully!");
    } else {
        console.log("\n💥 Email test failed. Check the error details above.");
    }
    process.exit(success ? 0 : 1);
});
