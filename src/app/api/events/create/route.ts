
// This API route is deprecated and no longer in use.
// Event creation is now handled by the `addEvent` function in `src/lib/firebase-service.ts`
// which is called directly from the client-side form. This file can be safely removed.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ message: 'This endpoint is deprecated.' }, { status: 404 });
}
