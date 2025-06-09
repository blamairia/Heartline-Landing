import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma as db } from '@/lib/prisma'
import { users } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationName: z.string().min(1),
  role: z.string().min(1),
  organizationType: z.string().min(1),
  organizationSize: z.string().min(1),
  specialties: z.array(z.string()).optional(),
  country: z.string().min(1),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, validatedData.email))

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      )
    }    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)

    // Map role to USER role - all user registrations get USER role
    const userRole = 'USER' // All new registrations are regular users

    // Create user
    const [user] = await db.insert(users).values({
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: userRole,
      phone: validatedData.phone,
      organization: validatedData.organizationName,
      position: validatedData.role, // Store the actual role/position as string
      emailVerified: new Date(), // Skip email verification for development
    }).returning()

    // TODO: Send verification email in production
    // await sendVerificationEmail(user.email, user.id)

    return NextResponse.json(
      {
        message: 'Account created successfully. You can now sign in to your account.',
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

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
