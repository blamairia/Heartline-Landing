import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma as db } from '@/lib/prisma';
import { users, invoices, subscriptions, subscriptionPlans, organizations } from '../../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db.select().from(users).where(eq(users.email, session.user.email));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get invoice with related data
    const [invoiceData] = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      currency: invoices.currency,
      status: invoices.status,
      description: invoices.description,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      notes: invoices.notes,      planName: subscriptionPlans.displayName,
      planPrice: subscriptionPlans.price, // Fixed field name
      orgName: organizations.name,
      // Remove non-existent organization fields for now
    })
    .from(invoices)
    .leftJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .leftJoin(users, eq(invoices.userId, users.id))
    .leftJoin(organizations, eq(users.organizationId, organizations.id)) // Fixed join path
    .where(and(eq(invoices.id, params.id), eq(invoices.userId, user.id)));

    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData, user);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Invoice download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' }, 
      { status: 500 }
    );
  }
}

async function generateInvoicePDF(invoice: any, user: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('HEARLINE WEBAPP', 50, 50);
      doc.fontSize(10).text('Professional Health Monitoring Solutions', 50, 75);
      
      // Company Info
      doc.text('Address: Algiers, Algeria', 50, 95);
      doc.text('Phone: +213 XXX XXX XXX', 50, 110);
      doc.text('Email: billing@hearline.dz', 50, 125);

      // Invoice Title
      doc.fontSize(16).text('INVOICE', 400, 50);
      doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 75);
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 95);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 115);
      
      // Status badge
      const statusColor = invoice.status === 'PAID' ? 'green' : 
                         invoice.status === 'OVERDUE' ? 'red' : 'orange';
      doc.fillColor(statusColor).text(`Status: ${invoice.status}`, 400, 135);
      doc.fillColor('black');

      // Line separator
      doc.moveTo(50, 170).lineTo(550, 170).stroke();

      // Bill To section
      doc.fontSize(14).text('Bill To:', 50, 190);
      doc.fontSize(11).text(user.name || user.email, 50, 210);
      doc.text(user.email, 50, 225);
      if (invoice.orgName) {
        doc.text(`Organization: ${invoice.orgName}`, 50, 240);
        if (invoice.orgAddress) doc.text(invoice.orgAddress, 50, 255);
      }

      // Service Details
      doc.fontSize(14).text('Service Details:', 50, 290);
      
      // Table header
      const tableTop = 320;
      doc.fontSize(10)
         .text('Description', 50, tableTop)
         .text('Period', 200, tableTop)
         .text('Amount', 400, tableTop)
         .text('Currency', 480, tableTop);

      // Line under header
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Service row
      const serviceRow = tableTop + 25;
      doc.text(invoice.description || `${invoice.planName} Subscription`, 50, serviceRow)
         .text(`Monthly Service`, 200, serviceRow)
         .text(`${Number(invoice.amount).toLocaleString()}`, 400, serviceRow)
         .text(invoice.currency, 480, serviceRow);

      // Total section
      const totalTop = serviceRow + 40;
      doc.moveTo(300, totalTop).lineTo(550, totalTop).stroke();
      
      doc.fontSize(12)
         .text('Subtotal:', 400, totalTop + 10)
         .text(`${Number(invoice.amount).toLocaleString()} ${invoice.currency}`, 480, totalTop + 10);

      doc.text('Tax (0%):', 400, totalTop + 30)
         .text(`0 ${invoice.currency}`, 480, totalTop + 30);

      doc.fontSize(14)
         .text('Total Amount:', 400, totalTop + 50)
         .text(`${Number(invoice.amount).toLocaleString()} ${invoice.currency}`, 480, totalTop + 50);

      // Payment Information
      if (invoice.status === 'PAID' && invoice.paidAt) {
        doc.fontSize(12).text(`Paid on: ${new Date(invoice.paidAt).toLocaleDateString()}`, 50, totalTop + 80);
      }

      // Footer
      const footerTop = doc.page.height - 100;
      doc.moveTo(50, footerTop).lineTo(550, footerTop).stroke();
      
      doc.fontSize(8)
         .text('Thank you for your business!', 50, footerTop + 10)
         .text('For support, contact us at support@hearline.dz', 50, footerTop + 25)
         .text('This is a computer-generated invoice.', 50, footerTop + 40)
         .text(`Generated on: ${new Date().toLocaleString()}`, 400, footerTop + 40);

      // Notes section
      if (invoice.notes) {
        doc.fontSize(10).text('Notes:', 50, totalTop + 100);
        doc.fontSize(9).text(invoice.notes, 50, totalTop + 115, { width: 500 });
      }

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}
