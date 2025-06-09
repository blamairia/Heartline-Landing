import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma as db } from '@/lib/prisma'
import { invoices, invoiceItems, subscriptions, subscriptionPlans } from '../../../../../../../db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscriptionId = params.id

    // Verify the subscription belongs to the user and get plan details
    const [subscriptionWithPlan] = await db
      .select({
        subscription: subscriptions,
        plan: subscriptionPlans
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id)
      ))
      .limit(1)

    if (!subscriptionWithPlan) {
      return NextResponse.json(
        { message: 'Subscription not found or access denied' },
        { status: 404 }
      )
    }

    // Get the invoice for this subscription
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.subscriptionId, subscriptionId))
      .limit(1)

    if (!invoice) {
      return NextResponse.json(
        { message: 'No invoice found for this subscription' },
        { status: 404 }
      )
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id))

    // Generate simple PDF content (HTML that can be printed to PDF)
    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: currency === 'DZD' ? 'DZD' : 'USD',
        minimumFractionDigits: 2
      }).format(amount / 100)
    }

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-info h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 28px;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            border-radius: 8px;
          }
          .info-box h3 {
            margin-top: 0;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .invoice-table th,
          .invoice-table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
          }
          .invoice-table th {
            background-color: #f9fafb;
            font-weight: bold;
          }
          .total-section {
            margin-top: 30px;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .total-final {
            font-size: 18px;
            font-weight: bold;
            background-color: #3b82f6;
            color: white;
            padding: 15px;
            margin-top: 10px;
          }
          .payment-instructions {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .payment-instructions h3 {
            color: #1d4ed8;
            margin-top: 0;
          }
          .bank-details {
            background-color: white;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>Hearline</h1>
            <p>Advanced Healthcare Solutions<br>
            Algiers, Algeria<br>
            contact@hearline.com</p>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">INVOICE</div>
            <div>${invoice.invoiceNumber}</div>
            <div style="margin-top: 10px;">
              <strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}<br>
              <strong>Due:</strong> ${new Date(invoice.dueDate || '').toLocaleDateString()}
            </div>
          </div>
        </div>

        <div class="details-grid">
          <div class="info-box">
            <h3>Invoice To:</h3>
            <p><strong>User ID:</strong> ${invoice.userId}<br>
            <strong>Subscription:</strong> ${subscriptionWithPlan.plan.displayName}</p>
          </div>
          
          <div class="info-box">
            <h3>Payment Details:</h3>
            <p><strong>Status:</strong> ${invoice.status}<br>
            <strong>Method:</strong> ${invoice.paymentProvider || 'Bank Transfer'}</p>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td>${formatCurrency(item.totalAmount, invoice.currency)}</td>
              </tr>
            `).join('') : `
              <tr>
                <td>${invoice.description}</td>
                <td>1</td>
                <td>${formatCurrency(invoice.amount, invoice.currency)}</td>
                <td>${formatCurrency(invoice.amount, invoice.currency)}</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.amount, invoice.currency)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(0, invoice.currency)}</span>
          </div>
          <div class="total-final">
            <div class="total-row" style="border: none; color: white;">
              <span>Total Amount:</span>
              <span>${formatCurrency(invoice.amount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        ${invoice.status !== 'PAID' ? `
        <div class="payment-instructions">
          <h3>Payment Instructions</h3>
          <p>Please transfer the amount to the following bank account:</p>
          <div class="bank-details">
            <strong>Bank:</strong> CCP Algeria<br>
            <strong>Account Number:</strong> 1234567890123456<br>
            <strong>Reference:</strong> ${invoice.invoiceNumber}<br>
            <strong>Amount:</strong> ${formatCurrency(invoice.amount, invoice.currency)}
          </div>
          <p><strong>Important:</strong> Please include the invoice number (${invoice.invoiceNumber}) as the payment reference.</p>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Thank you for your business!<br>
          This invoice was generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `

    // Return HTML content that can be saved as PDF
    return new Response(pdfContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.html"`
      }
    })

  } catch (error) {
    console.error('Get subscription invoice PDF error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
