
'use server';

import { z } from 'zod';
import Razorpay from 'razorpay';
import { createTicket, updateArtistToPremium } from '@/lib/firebase-service';

const CreateRazorpayOrderSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least ₹1'),
  receiptId: z.string().min(1, 'Receipt ID is required'),
});

export async function createRazorpayOrder(
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
    amount: Math.round(input.amount * 100), // amount in the smallest currency unit
    currency: 'INR',
    receipt: input.receiptId,
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

// Action to save ticket after Razorpay success
const SaveTicketSchema = z.object({
  userId: z.string(),
  eventId: z.string(),
  price: z.number(),
  contactDetails: z.object({
    buyerName: z.string(),
    buyerEmail: z.string(),
    buyerPhone: z.string(),
  }),
  razorpayPaymentId: z.string(),
});

export async function saveTicketAfterPayment(
  input: z.infer<typeof SaveTicketSchema>
) {
  const validation = SaveTicketSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid ticket data.' };
  }

  try {
    const isTest = validation.data.razorpayPaymentId.startsWith('test_demo_payment_');
    await createTicket(
      validation.data.userId,
      validation.data.eventId,
      validation.data.price,
      validation.data.contactDetails,
      {
        paymentId: validation.data.razorpayPaymentId,
        isTest: isTest,
      }
    );
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save ticket after payment:', error);
    return { success: false, error: error.message };
  }
}

// Action to handle premium subscription after Razorpay success
const SavePremiumSubscriptionSchema = z.object({
  userId: z.string(),
  razorpayPaymentId: z.string(),
});

export async function savePremiumAfterPayment(
  input: z.infer<typeof SavePremiumSubscriptionSchema>
) {
  const validation = SavePremiumSubscriptionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid subscription data.' };
  }

  try {
    await updateArtistToPremium(
      validation.data.userId,
      validation.data.razorpayPaymentId
    );
    return { success: true };
  } catch (error: any)
  {
    console.error('Failed to save premium subscription after payment:', error);
    return { success: false, error: error.message };
  }
}
