// Test to verify which email service is being imported
import { sendDemoRequestConfirmation } from '@/lib/email'

console.log('Testing email service import...')
console.log('Function source:', sendDemoRequestConfirmation.toString().substring(0, 200))

export async function GET() {
  return Response.json({ 
    message: 'Email service test',
    functionExists: typeof sendDemoRequestConfirmation === 'function'
  })
}
