import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma as db } from '@/lib/prisma'
import { contactSubmissions } from '../../../../db/schema'
import { sendDemoRequestConfirmation, sendDemoRequestNotification } from '@/lib/email'

const demoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().min(1),
  organizationName: z.string().min(1),
  organizationType: z.string().min(1),
  organizationSize: z.string().min(1),
  currentECGSystem: z.string().optional(),
  primaryUseCase: z.string().min(1),
  interestedFeatures: z.array(z.string()),
  timeframe: z.string().min(1),
  preferredDemoType: z.string().min(1),
  additionalRequirements: z.string().optional(),
  country: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEMO API START ===')
    const body = await request.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))
    
    const validatedData = demoSchema.parse(body)
    console.log('Data validation successful')

    // Log which email functions we're about to use
    console.log('Email functions available:', {
      confirmationFunction: typeof sendDemoRequestConfirmation,
      notificationFunction: typeof sendDemoRequestNotification
    })    // Save demo request to database
    console.log('Creating database record...')
    const [demoRequest] = await db.insert(contactSubmissions).values({
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      email: validatedData.email,
      message: `Demo request details:
Job Title: ${validatedData.jobTitle}
Organization: ${validatedData.organizationName}
Organization Type: ${validatedData.organizationType}
Phone: ${validatedData.phone || 'Not provided'}
Organization Size: ${validatedData.organizationSize}
${validatedData.currentECGSystem ? `Current ECG System: ${validatedData.currentECGSystem}` : ''}
Primary Use Case: ${validatedData.primaryUseCase}
Interested Features: ${validatedData.interestedFeatures.join(', ')}
Timeframe: ${validatedData.timeframe}
Preferred Demo Type: ${validatedData.preferredDemoType}
Country: ${validatedData.country}
${validatedData.additionalRequirements ? `Additional Requirements: ${validatedData.additionalRequirements}` : ''}`,
    }).returning()
    console.log('Database record created successfully:', demoRequest.id)    // Send emails
    console.log('=== EMAIL SENDING START ===')
    try {
      console.log('Sending confirmation email to:', validatedData.email)
      // Send confirmation email to customer
      const confirmationResult = await sendDemoRequestConfirmation({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        organizationName: validatedData.organizationName,
        preferredDemoType: validatedData.preferredDemoType,
        timeframe: validatedData.timeframe,
        interestedFeatures: validatedData.interestedFeatures,
      })
      console.log('Confirmation email sent successfully:', confirmationResult.id)

      console.log('Sending notification email to admin:', process.env.ADMIN_EMAIL)
      // Send notification email to admin/sales team
      const notificationResult = await sendDemoRequestNotification({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        jobTitle: validatedData.jobTitle,
        organizationName: validatedData.organizationName,
        organizationType: validatedData.organizationType,
        organizationSize: validatedData.organizationSize,
        currentECGSystem: validatedData.currentECGSystem,
        primaryUseCase: validatedData.primaryUseCase,
        interestedFeatures: validatedData.interestedFeatures,
        timeframe: validatedData.timeframe,
        preferredDemoType: validatedData.preferredDemoType,
        additionalRequirements: validatedData.additionalRequirements,
        country: validatedData.country,      })
      console.log('Notification email sent successfully:', notificationResult.id)    } catch (emailError: any) {
      console.error('Email sending error:', emailError)
      console.error('Email error details:', {
        message: emailError?.message || 'Unknown error',
        stack: emailError?.stack || 'No stack trace',
        code: emailError?.code || 'No error code',
        command: emailError?.command || 'No command'
      })
      // Don't fail the request if email sending fails
    }

    return NextResponse.json(
      {
        message: 'Demo request submitted successfully. Our team will contact you within 24 hours to schedule your personalized demo.',
        id: demoRequest.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Demo request error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
