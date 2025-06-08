import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('Prisma test endpoint called')
    console.log('Prisma client:', typeof prisma)
    console.log('Prisma contactInquiry:', typeof prisma?.contactInquiry)
    console.log('Prisma contactInquiry.create:', typeof prisma?.contactInquiry?.create)
    
    // Test a simple query first
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Prisma test successful',
      userCount,
      prismaType: typeof prisma,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Prisma test endpoint error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
