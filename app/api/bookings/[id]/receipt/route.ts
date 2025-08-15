import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/prismaClient";
import { NextRequest } from "next/server";
import { safeFormatDate, safeFormatTime } from "@/lib/utils/dateHelpers";

// Receipt template - simple HTML that can be converted to PDF
function generateReceiptHTML(booking: any, user: any) {
  const formatDate = (dateString: string) => {
    return safeFormatDate(dateString, 'en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return safeFormatTime(timeString, 'en-IN');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Receipt - ${booking.hashId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        .receipt {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .receipt-title {
          font-size: 20px;
          color: #374151;
          margin-bottom: 5px;
        }
        .receipt-number {
          color: #6b7280;
          font-size: 14px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e5e5e5;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .info-label {
          color: #6b7280;
          font-size: 14px;
        }
        .info-value {
          color: #374151;
          font-weight: 500;
          font-size: 14px;
        }
        .amount-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .amount-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .total-row {
          border-top: 2px solid #e5e5e5;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
          font-size: 16px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .status-confirmed {
          background: #dcfce7;
          color: #166534;
        }
        .status-completed {
          background: #e0e7ff;
          color: #3730a3;
        }
        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e5e5;
          padding-top: 20px;
        }
        @media print {
          body { background: white; }
          .receipt { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">QuickCourt</div>
          <div class="receipt-title">Booking Receipt</div>
          <div class="receipt-number">Receipt #${booking.hashId}</div>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${user.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${user.email}</span>
          </div>
          ${user.phone ? `
          <div class="info-item">
            <span class="info-label">Phone:</span>
            <span class="info-value">${user.phone}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Booking Details</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Facility:</span>
                <span class="info-value">${booking.facility.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Court:</span>
                <span class="info-value">${booking.court.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Sport:</span>
                <span class="info-value">${booking.court.sportType.replace('_', ' ')}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Date:</span>
                <span class="info-value">${formatDate(booking.bookingDate)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Time:</span>
                <span class="info-value">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Duration:</span>
                <span class="info-value">${booking.totalHours} hours</span>
              </div>
            </div>
          </div>
          <div class="info-item" style="margin-top: 15px;">
            <span class="info-label">Address:</span>
            <span class="info-value">${booking.facility.address}, ${booking.facility.city}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
            </span>
          </div>
        </div>

        ${booking.payment ? `
        <div class="section">
          <div class="section-title">Payment Information</div>
          <div class="amount-section">
            <div class="amount-row">
              <span>Court Fee (${booking.totalHours}h × ₹${booking.pricePerHour.toLocaleString()}):</span>
              <span>₹${booking.totalAmount.toLocaleString()}</span>
            </div>
            <div class="amount-row">
              <span>Platform Fee:</span>
              <span>₹${booking.platformFee.toLocaleString()}</span>
            </div>
            <div class="amount-row">
              <span>Tax:</span>
              <span>₹${booking.tax.toLocaleString()}</span>
            </div>
            <div class="amount-row total-row">
              <span>Total Amount:</span>
              <span>₹${booking.finalAmount.toLocaleString()}</span>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e5e5;">
              <div class="info-item">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${booking.payment.paymentMethod.replace('_', ' ')}</span>
              </div>
              ${booking.payment.transactionId ? `
              <div class="info-item">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${booking.payment.transactionId}</span>
              </div>
              ` : ''}
              <div class="info-item">
                <span class="info-label">Payment Status:</span>
                <span class="info-value">
                  <span class="status-badge status-${booking.payment.status.toLowerCase()}">${booking.payment.status}</span>
                </span>
              </div>
              ${booking.payment.paidAt ? `
              <div class="info-item">
                <span class="info-label">Paid On:</span>
                <span class="info-value">${formatDate(booking.payment.paidAt)}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        ` : ''}

        ${booking.specialRequests ? `
        <div class="section">
          <div class="section-title">Special Requests</div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; font-size: 14px;">
            ${booking.specialRequests}
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for choosing QuickCourt!</p>
          <p>For support, contact us at support@quickcourt.com</p>
          <p>Generated on ${formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { id: bookingId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'html'; // html or pdf

    const requestId = crypto.randomUUID();

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        bookingId,
        format
      },
      message: 'Generating booking receipt',
    });

    // Get the booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        userId: session.user.id // Ensure user owns the booking
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true,
          }
        },
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!booking) {
      return new Response('Booking not found', { status: 404 });
    }

    // Only allow receipt generation for bookings with payment
    if (!booking.payment || booking.payment.status !== 'COMPLETED') {
      return Response.json(
        { error: 'Receipt is only available for completed payments' },
        { status: 400 }
      );
    }

    const receiptHTML = generateReceiptHTML(booking, booking.user);

    if (format === 'html') {
      return new Response(receiptHTML, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="receipt-${booking.hashId}.html"`
        }
      });
    }

    // For PDF generation, you would need to use a library like puppeteer
    // For now, we'll return HTML with print-friendly CSS
    return new Response(receiptHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="receipt-${booking.hashId}.html"`
      }
    });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Failed to generate booking receipt',
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}
