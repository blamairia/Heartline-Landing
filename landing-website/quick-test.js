const { EmailClient } = require("@azure/communication-email");

const connectionString = "endpoint=https://heartline-emailcommunicationservice.unitedstates.communication.azure.com/;accesskey=61alnx09mdrGAenIbSD4e42auJjnhOmA9dqaWTfBz2GzwFVOGofeJQQJ99BFACULyCpggvBoAAAAAZCSteS7";

async function quickTest() {
    console.log("Starting Azure email test...");
    
    try {
        const emailClient = new EmailClient(connectionString);
        console.log("✅ EmailClient created successfully");
        
        const message = {
            senderAddress: "DoNotReply@heartline.tech",
            content: {
                subject: "Quick Test",
                plainText: "Test message",
            },
            recipients: {
                to: [{ address: "blamairia@gmail.com" }],
            },
        };
        
        console.log("📧 Attempting to send email...");
        const poller = await emailClient.beginSend(message);
        console.log("✅ beginSend completed, operation started");
        
        // Don't wait, just check initial status
        const state = poller.getOperationState();
        console.log("Initial state:", state);
        
        return true;
        
    } catch (error) {
        console.log("❌ ERROR:", error.message);
        console.log("Error code:", error.code);
        console.log("Status code:", error.statusCode);
        
        if (error.code === 'DomainNotLinked') {
            console.log("\n🔍 CONFIRMED: Domain linking issue!");
            console.log("SOLUTION: Link heartline.tech to heartline-EmailCommunicationService");
        }
        
        return false;
    }
}

quickTest().then(() => {
    console.log("Test completed");
    process.exit(0);
}).catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
