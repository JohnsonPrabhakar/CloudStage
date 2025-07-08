'use server';

import { z } from 'zod';

const CreateOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  receiptId: z.string().min(1, 'Receipt ID is required'),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(10),
  // Metadata for the webhook
  userId: z.string().min(1),
  eventId: z.string().optional(), // Required for tickets
  planName: z.string().optional(), // For premium subscription
});

export async function createCashfreeOrder(
  input: z.infer<typeof CreateOrderSchema>
) {
  const validation = CreateOrderSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const {
    amount,
    receiptId,
    customer_name,
    customer_email,
    customer_phone,
    userId,
    eventId,
    planName,
  } = validation.data;

  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    console.error('Cashfree keys are not configured in .env');
    return {
      success: false,
      error: 'Payment system is not configured. Please contact support.',
    };
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !appUrl.startsWith('https')) {
    console.error('NEXT_PUBLIC_APP_URL is not set or is not a HTTPS URL in .env');
    return {
      success: false,
      error: 'Application URL is not configured correctly. Please contact support.',
    };
  }

  const order_meta = {
    // The return URL is where the user is sent after payment. The webhook handles the actual confirmation.
    return_url: `${appUrl}/my-tickets?order_id={order_id}`,
    ...(eventId && { eventId: eventId }),
    ...(userId && { userId: userId }),
    ...(planName && { planName: planName }),
  };

  const orderData = {
    order_id: receiptId,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: userId,
      customer_name: customer_name,
      customer_email: customer_email,
      customer_phone: customer_phone,
    },
    order_meta: order_meta,
    order_note: `Order for ${receiptId}`,
  };

  const headers = {
    accept: 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'content-type': 'application/json',
  };

  try {
    const response = await fetch(`${process.env.CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('Cashfree API Error:', errorBody);
        throw new Error(errorBody.message || 'Failed to create Cashfree order');
    }

    const order = await response.json();
    return { success: true, order };
  } catch (error: any) {
    console.error('Cashfree order creation failed:', error);
    return {
      success: false,
      error: error.message || 'Could not initiate payment. Please try again.',
    };
  }
}
