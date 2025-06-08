import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
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
    const body = await request.json()
    const validatedData = demoSchema.parse(body)

    // Save demo request to database
    const demoRequest = await prisma.demoRequest.create({
      data: {
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
        country: validatedData.country,
        status: 'NEW',
      },
    })    // Send emails
    try {
      // Send confirmation email to customer
      await sendDemoRequestConfirmation({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        organizationName: validatedData.organizationName,
        preferredDemoType: validatedData.preferredDemoType,
        timeframe: validatedData.timeframe,
        interestedFeatures: validatedData.interestedFeatures,
      })

      // Send notification email to admin/sales team
      await sendDemoRequestNotification({
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
        country: validatedData.country,
      })
    } catch (emailError) {
      console.error('Email sending error:', emailError)
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
