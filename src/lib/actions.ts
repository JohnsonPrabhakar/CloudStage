'use server';

import Razorpay from 'razorpay';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  receiptId: z.string().min(1, 'Receipt ID is required'),
});

export async function createRazorpayOrder(
  input: z.infer<typeof CreateOrderSchema>
) {
  const validation = CreateOrderSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const { amount, receiptId } = validation.data;

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
    amount: amount * 100, // Amount in paise
    currency: 'INR',
    receipt: receiptId,
  };

  try {
    const order = await razorpay.orders.create(options);
    return { success: true, order };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return {
      success: false,
      error: 'Could not initiate payment. Please try again.',
    };
  }
}
