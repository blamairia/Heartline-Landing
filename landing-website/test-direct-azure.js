const { EmailClient } = require("@azure/communication-email");

const connectionString = "endpoint=https://heartline-emailcommunicationservice.unitedstates.communication.azure.com/;accesskey=61alnx09mdrGAenIbSD4e42auJjnhOmA9dqaWTfBz2GzwFVOGofeJQQJ99BFACULyCpggvBoAAAAAZCSteS7";
const client = new EmailClient(connectionString);

async function main() {
    const emailMessage = {
        senderAddress: "DoNotReply@heartline.tech",
        content: {
            subject: "Test Email",
            plainText: "Hello world via email.",
            html: `
			<html>
				<body>
					<h1>Hello world via email.</h1>
				</body>
			</html>`,
        },
        recipients: {
            to: [{ address: "blamairia@gmail.com" }],
        },
        
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
}

main();