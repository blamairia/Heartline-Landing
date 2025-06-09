import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/prisma'
import { users } from '../../../../db/schema'
import { count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    console.log('Drizzle test endpoint called')
    console.log('Drizzle client:', typeof db)
    
    // Test a simple query first
    const [{ userCount }] = await db.select({ userCount: count() }).from(users)
    console.log('User count:', userCount)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Drizzle test successful',
      userCount,
      drizzleType: typeof db,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Drizzle test endpoint error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
