import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma as db } from '@/lib/prisma'
import { users, passwordResetTokens } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find valid reset token
    const resetToken = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1)

    if (resetToken.length === 0 || resetToken[0].expires < new Date()) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, resetToken[0].email)).limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 12)    // Update password and delete reset token
    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user[0].id))
      
      await tx.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
    })

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
