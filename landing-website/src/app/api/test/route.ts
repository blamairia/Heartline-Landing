import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Test endpoint called')
    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Test endpoint failed' },
      { status: 500 }
    )
  }
}
