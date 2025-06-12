import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma as db } from '@/lib/prisma'
import { users, passwordResetTokens } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email' // Added import

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

    // Always return success to prevent email enumeration
    if (user.length === 0) {
      console.log(`Password reset requested for non-existent user: ${email}`)
      return NextResponse.json(
        { message: 'If an account with that email exists, we have sent a password reset link.' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetTokenValue = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save reset token to database
    await db.insert(passwordResetTokens).values({
      email,
      token: resetTokenValue,
      expires: resetTokenExpiry,
    }).catch(dbError => {
      console.error('Database error inserting password reset token:', dbError)
      // Decide if you want to throw or return a generic error to the user
      throw new Error('Failed to process password reset token.')
    })

    // Send password reset email
    const emailSendResult = await sendPasswordResetEmail(email, resetTokenValue)
    if (!emailSendResult.success) {
      // Log the error and potentially inform the user, though typically you wouldn't reveal email sending failures for security.
      console.error('Failed to send password reset email:', emailSendResult.error)
      // Even if email fails, for security, don't tell the user the email failed.
      // The user message remains the same to prevent account enumeration.
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, we have sent a password reset link.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Generic error for other issues
    return NextResponse.json(
      { message: 'An error occurred while processing your request.' }, // Changed from Internal server error for less detail to user
      { status: 500 }
    )
  }
}
