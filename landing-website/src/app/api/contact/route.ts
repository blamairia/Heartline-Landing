import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendContactInquiryConfirmation, sendContactInquiryNotification } from '@/lib/smtp-email'

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  inquiryType: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // Save contact inquiry to database
    const contact = await prisma.contactInquiry.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        company: validatedData.company,
        inquiryType: validatedData.inquiryType,
        subject: validatedData.subject,
        message: validatedData.message,
        status: 'NEW',
      },
    })    // Send emails
    try {
      // Send confirmation email to customer
      await sendContactInquiryConfirmation({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        company: validatedData.company,
        inquiryType: validatedData.inquiryType,
        subject: validatedData.subject,
        message: validatedData.message,
      })

      // Send notification email to admin/support team
      await sendContactInquiryNotification({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        company: validatedData.company,
        inquiryType: validatedData.inquiryType,
        subject: validatedData.subject,
        message: validatedData.message,
      })
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Don't fail the request if email sending fails
    }

    return NextResponse.json(
      {
        message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
        id: contact.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Contact form error:', error)

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
