import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('SMTP test endpoint called')
    
    // Import nodemailer directly here to test
    const nodemailer = require('nodemailer')
    
    // Create transporter matching the working test script
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    })
    
    // Send test email
    const result = await transporter.sendMail({
      from: `"Hearline AI API Test" <${process.env.SMTP_USER}>`,
      to: 'blamairia@gmail.com',
      subject: 'SMTP API Test - Hearline AI',
      text: 'This is a test email sent from the Next.js API endpoint to verify SMTP is working.',
      html: '<p>This is a test email sent from the Next.js API endpoint to verify SMTP is working.</p>'
    })
    
    console.log('SMTP test successful:', result.messageId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'SMTP test successful',
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    })
      } catch (error) {
    console.error('SMTP test endpoint error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
