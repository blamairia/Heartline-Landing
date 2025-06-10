const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testSMTP() {
  console.log('🔍 Testing SMTP Configuration...\n');

  // Display configuration (without passwords)
  console.log('📧 SMTP Configuration:');
  console.log(`Host: ${process.env.SMTP_HOST}`);
  console.log(`Port: ${process.env.SMTP_PORT}`);
  console.log(`User: ${process.env.SMTP_USER}`);
  console.log(`Password: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}\n`);
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // For development/testing
    }
  });

  try {
    // Test connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Heartline AI Test" <${process.env.SMTP_USER}>`,
      to: 'blamairia@gmail.com',
      subject: 'SMTP Test - Heartline AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🏥 Heartline AI</h1>
            <p style="color: #666; margin: 5px 0;">SMTP Test Email</p>
          </div>
          
          <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">SMTP Configuration Test</h2>
          
          <p><strong>✅ SMTP is working correctly!</strong></p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Test Details:</h3>
            <ul style="color: #6c757d;">
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>From:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>To:</strong> blamairia@gmail.com</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This email was sent automatically to test the Heartline AI SMTP configuration.
            If you received this email, the email system is working correctly! 🎉
          </p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              Heartline AI - Advanced Cardiac AI Solutions<br>
              Powered by AI for Better Healthcare
            </p>
          </div>
        </div>
      `,
      text: `
SMTP Test - Heartline AI

✅ SMTP is working correctly!

Test Details:
- Timestamp: ${new Date().toISOString()}
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From: ${process.env.SMTP_USER}
- To: blamairia@gmail.com

This email was sent automatically to test the Heartline AI SMTP configuration.
If you received this email, the email system is working correctly! 🎉

Heartline AI - Advanced Cardiac AI Solutions
Powered by AI for Better Healthcare
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📬 Accepted recipients: ${info.accepted.join(', ')}`);
    
    if (info.rejected.length > 0) {
      console.log(`❌ Rejected recipients: ${info.rejected.join(', ')}`);
    }

    console.log('\n🎉 SMTP test completed successfully!');
    console.log('📧 Check the inbox at blamairia@gmail.com for the test email.');

  } catch (error) {
    console.error('❌ SMTP test failed:', error);
    
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    if (error.response) {
      console.error(`Server Response: ${error.response}`);
    }
    if (error.responseCode) {
      console.error(`Response Code: ${error.responseCode}`);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check if SMTP credentials are correct');
    console.log('2. Verify SMTP server settings (host, port)');
    console.log('3. Check if the email account has SMTP enabled');
    console.log('4. Verify firewall/network settings');
    console.log('5. Check if 2FA is enabled (may need app password)');
  } finally {
    // Close the transporter
    transporter.close();
  }
}

// Check if required environment variables are set
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ Missing required SMTP environment variables:');
  console.error('Please ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set in .env.local');
  process.exit(1);
}

// Run the test
testSMTP().catch(console.error);
