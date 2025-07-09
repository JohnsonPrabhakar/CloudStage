
import { NextResponse } from 'next/server';
import { createTicket, updateArtistToPremium } from '@/lib/firebase-service';
import crypto from 'crypto';

// This is the new, secure webhook for Razorpay.
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
      console.error('Razorpay Webhook: Secret key is not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    // 1. Verify webhook signature
    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
        
    if (generatedSignature !== signature) {
        console.warn('Razorpay Webhook: Invalid signature received.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const event = JSON.parse(body);

    // 2. Process based on event type
    if (event.event === 'order.paid') {
        const order = event.payload.order.entity;
        const payment = event.payload.payment.entity;
        const notes = order.notes || {};

        console.log(`Razorpay Webhook: Received paid order for type '${notes.type}'`);

        if (notes.type === 'premium' && notes.userId) {
            await updateArtistToPremium(notes.userId, payment.id);
            console.log(`Razorpay Webhook: Successfully updated artist ${notes.userId} to premium.`);
        } else if (notes.type === 'ticket' && notes.eventId && notes.userId) {
            const ticketData = {
                buyerName: notes.buyerName,
                buyerEmail: notes.buyerEmail,
                buyerPhone: notes.buyerPhone,
            };
            await createTicket(
                notes.userId,
                notes.eventId,
                order.amount / 100, // convert from paisa back to rupees
                ticketData,
                { paymentId: payment.id }
            );
            console.log(`Razorpay Webhook: Successfully created ticket for event ${notes.eventId} for user ${notes.userId}.`);
        } else {
             console.warn('Razorpay Webhook: Received paid order without recognizable metadata (notes.type).');
        }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Razorpay Webhook - Critical Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed', message: error.message }, { status: 500 });
  }
}
