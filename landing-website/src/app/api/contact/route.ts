import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma as db } from '@/lib/prisma'
import { contactSubmissions } from '../../../../db/schema'
import { sendContactInquiryConfirmation, sendContactInquiryNotification } from '@/lib/email'

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

export async function POST(request: NextRequest) {  try {
    console.log('Contact API called')
    console.log('Drizzle client type:', typeof db)
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = contactSchema.parse(body)
    console.log('Validated data:', validatedData)    // Save contact inquiry to database
    console.log('Creating contact submission...')
    const [contact] = await db.insert(contactSubmissions).values({
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      email: validatedData.email,
      message: `Subject: ${validatedData.subject}\nCompany: ${validatedData.company}\nPhone: ${validatedData.phone}\n\nMessage:\n${validatedData.message}`,
    }).returning()
    
    console.log('Contact created:', contact.id)
    
    // Send emails
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
      
      console.log('Emails sent successfully')
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
