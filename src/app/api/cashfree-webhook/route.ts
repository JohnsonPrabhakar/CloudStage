import { NextResponse } from 'next/server';
import { createTicket, updateArtistToPremium } from '@/lib/firebase-service';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!signature || !timestamp || !secretKey) {
        console.warn('Cashfree Webhook: Missing headers.');
        return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
    }
    
    // 1. Verify webhook signature
    const message = timestamp + body;
    const generatedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(message)
        .digest('base64');
        
    if (generatedSignature !== signature) {
        console.warn('Cashfree Webhook: Invalid signature received.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    console.log(`Cashfree Webhook: Received event type '${event.type}'`);

    // 2. Process based on event type
    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK' && event.data.order.order_status === 'PAID') {
        const order = event.data.order;
        const payment = event.data.payment;
        const { order_meta, customer_details } = order;

        // Check if it's a premium subscription or a ticket based on metadata
        if (order_meta.planName && !order_meta.eventId) {
            await updateArtistToPremium(customer_details.customer_id, payment.cf_payment_id);
            console.log(`Cashfree Webhook: Successfully updated artist ${customer_details.customer_id} to premium.`);
        } else if (order_meta.eventId) {
            const ticketData = {
                buyerName: customer_details.customer_name,
                buyerEmail: customer_details.customer_email,
                buyerPhone: customer_details.customer_phone,
            };
            await createTicket(
                customer_details.customer_id,
                order_meta.eventId,
                order.order_amount,
                ticketData,
                { paymentId: payment.cf_payment_id, isTest: false }
            );
            console.log(`Cashfree Webhook: Successfully created ticket for event ${order_meta.eventId} for user ${customer_details.customer_id}.`);
        } else {
             console.warn('Cashfree Webhook: Received PAID order without recognizable metadata (planName or eventId).');
        }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Cashfree Webhook - Critical Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
