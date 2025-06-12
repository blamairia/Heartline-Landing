import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '../../../../../db/client' // Corrected import for db
import { users, verificationTokens } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationName: z.string().min(1),
  role: z.string().min(1), // Will be overridden to USER
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
    const [existingUser] = await db.select().from(users).where(eq(users.email, validatedData.email))

    if (existingUser) {
      // If user exists but is not verified, resend verification email
      if (!existingUser.emailVerified) {
        if (!existingUser.email) {
          console.error('Existing user email is missing, cannot send verification.');
          return NextResponse.json(
            { message: 'User email is missing, cannot send verification.' },
            { status: 500 }
          );
        }
        // Generate a new verification token
        const verificationTokenValue = randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours from now

        // Use existingUser.email as the identifier as per schema
        await db.insert(verificationTokens).values({
          identifier: existingUser.email, // Email is now guaranteed to be non-null
          token: verificationTokenValue,
          expires: verificationTokenExpiry,
        }).onConflictDoUpdate({
          target: verificationTokens.identifier, // Target the identifier column for conflict
          set: {
            token: verificationTokenValue,
            expires: verificationTokenExpiry,
          }
        });

        await sendVerificationEmail(existingUser.email, existingUser.id, verificationTokenValue);
        return NextResponse.json(
          { message: 'User already exists. A new verification email has been sent. Please check your inbox.' },
          { status: 409 } // Conflict
        )
      }
      return NextResponse.json(
        { message: 'User already exists with this email and is verified.' },
        { status: 409 } // Conflict
      )
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)

    const userRole = 'USER' // All new registrations are regular users

    // Create user
    const [newUser] = await db.insert(users).values({
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      email: validatedData.email,
      password: hashedPassword,
      role: userRole,
      // emailVerified will be null until user verifies
    }).returning()

    if (!newUser) {
      console.error('Failed to create new user after insert operation.');
      return NextResponse.json(
        { message: 'Failed to create user account.' },
        { status: 500 }
      );
    }

    if (!newUser.email) {
      console.error('Newly created user is missing an email.');
      // Potentially delete the user record here if email is critical and cannot be recovered
      return NextResponse.json(
        { message: 'Failed to create user account, email missing after creation.' },
        { status: 500 }
      );
    }

    // Generate verification token
    const verificationTokenValue = randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours

    // Use newUser.email as the identifier
    await db.insert(verificationTokens).values({
      identifier: newUser.email, // Email is now guaranteed to be non-null
      token: verificationTokenValue,
      expires: verificationTokenExpiry,
    });

    // Send verification email
    await sendVerificationEmail(newUser.email, newUser.id, verificationTokenValue);

    return NextResponse.json(
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        userId: newUser.id,
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
