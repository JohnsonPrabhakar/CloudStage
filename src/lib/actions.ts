
'use server';

import { z } from 'zod';
import Razorpay from 'razorpay';

const CreateRazorpayOrderSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least ₹1'),
  receiptId: z.string().min(1, 'Receipt ID is required'),
  notes: z.record(z.string()).optional(), // For metadata like eventId, userId, planName
});

async function createRazorpayOrder(
  input: z.infer<typeof CreateRazorpayOrderSchema>
) {
  const validation = CreateRazorpayOrderSchema.safeParse(input);
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || 'Invalid input.';
    return { success: false, error: errorMessage };
  }

  if (
    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    console.error('Razorpay keys are not configured in .env');
    return {
      success: false,
      error: 'Payment system is not configured. Please contact support.',
    };
  }

  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount: Math.round(validation.data.amount * 100), // amount in the smallest currency unit
    currency: 'INR',
    receipt: validation.data.receiptId,
    notes: validation.data.notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    const errorMessage =
      error?.error?.description ||
      error.message ||
      'Could not initiate payment. Please try again.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export { createRazorpayOrder };
