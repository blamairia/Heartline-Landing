import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)

    // Create user and organization
    const user = await prisma.$transaction(async (tx) => {
      // Create organization first
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          type: validatedData.organizationType,
          size: validatedData.organizationSize,
          specialties: validatedData.specialties || [],
          country: validatedData.country,
        },
      })

      // Create user
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
          phone: validatedData.phone,
          organizationId: organization.id,
          emailVerified: null, // Will be set when email is verified
        },
      })

      return { user: newUser, organization }
    })

    // TODO: Send verification email
    // await sendVerificationEmail(user.user.email, user.user.id)

    return NextResponse.json(
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        userId: user.user.id,
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
