
import { NextResponse } from 'next/server';

// This webhook is deprecated as Razorpay has been removed.
export async function POST(request: Request) {
  return NextResponse.json({ status: 'deprecated' });
}
