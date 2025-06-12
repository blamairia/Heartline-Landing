console.log("Starting Azure Email Test...");

try {
    const { EmailClient } = require("@azure/communication-email");
    console.log("EmailClient imported successfully");
    
    const connectionString = "endpoint=https://heartline-emailcommunicationservice.unitedstates.communication.azure.com/;accesskey=61alnx09mdrGAenIbSD4e42auJjnhOmA9dqaWTfBz2GzwFVOGofeJQQJ99BFACULyCpggvBoAAAAAZCSteS7";
    console.log("Connection string set");
    
    const emailClient = new EmailClient(connectionString);
    console.log("EmailClient created successfully");
    
    const testEmail = async () => {
        console.log("Starting email test...");
        
        const emailMessage = {
            senderAddress: "DoNotReply@heartline.tech",
            content: {
                subject: "Simple Test",
                plainText: "Test message",
            },
            recipients: {
                to: [{ address: "blamairia@gmail.com" }],
            },
        };
        
        console.log("Email message configured:", JSON.stringify(emailMessage, null, 2));
        
        try {
            console.log("Calling beginSend...");
            const poller = await emailClient.beginSend(emailMessage);
            console.log("beginSend completed, poller created");
            
            console.log("Poller state:", poller.getOperationState());
            
            if (!poller.getOperationState().isStarted) {
                console.log("ERROR: Poller was not started");
                return;
            }
            
            console.log("Polling for result...");
            
            // Simple polling loop
            let attempts = 0;
            while (!poller.isDone() && attempts < 5) {
                console.log(`Polling attempt ${attempts + 1}...`);
                await poller.poll();
                await new Promise(r => setTimeout(r, 5000));
                attempts++;
            }
            
            const result = poller.getResult();
            console.log("Final result:", JSON.stringify(result, null, 2));
            
        } catch (emailError) {
            console.log("Email sending error:");
            console.log("- Name:", emailError.name);
            console.log("- Code:", emailError.code);
            console.log("- Message:", emailError.message);
            console.log("- Status Code:", emailError.statusCode);
            
            if (emailError.details) {
                console.log("- Details:", JSON.stringify(emailError.details, null, 2));
            }
        }
    };
    
    testEmail().then(() => {
        console.log("Test completed");
    }).catch(err => {
        console.log("Test error:", err);
    });
    
} catch (importError) {
    console.log("Import error:", importError.message);
}
