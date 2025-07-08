// This webhook is deprecated as the payment gateway has been migrated from Cashfree.
// This file can be safely removed in the future.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ status: 'deprecated' });
}
