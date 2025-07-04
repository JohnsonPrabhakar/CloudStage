
import { NextResponse } from 'next/server';
import { collection, addDoc, updateDoc, serverTimestamp, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { type EventCategory } from '@/lib/types';

export async function POST(request: Request) {
  console.log('[API /events/create] Received POST request.');
  try {
    const formData = await request.formData();
    console.log('[API /events/create] Form data parsed.');
    const bannerFile = formData.get('banner') as File | null;
    
    // Extract and type-check all form fields
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const artistId = formData.get('artistId') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as EventCategory;
    const genre = formData.get('genre') as string;
    const language = formData.get('language') as string;
    const date = formData.get('date') as string;
    const streamUrl = formData.get('streamUrl') as string;
    const ticketPrice = Number(formData.get('ticketPrice'));
    const isBoosted = formData.get('boost') === 'true';

    if (!title || !artist || !artistId || !date || !streamUrl) {
        console.error('[API /events/create] Missing required fields.');
        return NextResponse.json({ message: 'Missing required event fields.' }, { status: 400 });
    }

    console.log(`[API /events/create] Creating event titled: ${title}`);

    // Step 1: Create the event document in Firestore to get an ID
    const eventData = {
      title,
      artist,
      artistId,
      description,
      category,
      genre,
      language,
      date: new Date(date).toISOString(),
      status: new Date(date) > new Date() ? 'upcoming' : 'past',
      streamUrl,
      ticketPrice,
      isBoosted,
      boostAmount: isBoosted ? 100 : 0,
      views: 0,
      watchTime: 0,
      ticketsSold: 0,
      moderationStatus: 'pending',
      createdAt: serverTimestamp(),
      bannerUrl: '', // Will be updated after upload
      eventCode: 'TBA',
    };
    
    const docRef = await addDoc(collection(db, 'events'), eventData);
    const eventId = docRef.id;
    console.log(`[API /events/create] Firestore document created with ID: ${eventId}`);

    // Step 2: Generate and update the eventCode
    const eventCode = `EVT-${eventId.substring(0, 8).toUpperCase()}`;
    await updateDoc(docRef, { eventCode });
    console.log(`[API /events/create] Event code updated to: ${eventCode}`);

    // Step 3: If a banner file exists, upload it and update the document
    let finalBannerUrl = 'https://placehold.co/1280x720.png';

    if (bannerFile) {
      console.log(`[API /events/create] Banner file found: ${bannerFile.name}. Starting upload...`);
      const bannerPath = `artists/${artistId}/events/${eventId}/banner.jpg`;
      const storageRef = ref(storage, bannerPath);
      
      // FIX: Pass the File object from FormData directly to uploadBytes.
      // This is more robust than converting to an ArrayBuffer in a server environment.
      await uploadBytes(storageRef, bannerFile, { contentType: bannerFile.type });
      
      console.log(`[API /events/create] Upload complete for path: ${bannerPath}`);
      finalBannerUrl = await getDownloadURL(storageRef);
      console.log(`[API /events/create] Got download URL: ${finalBannerUrl}`);
    } else {
        console.log('[API /events/create] No banner file provided. Using placeholder.');
    }
    
    await updateDoc(docRef, { bannerUrl: finalBannerUrl });
    console.log('[API /events/create] Document updated with final banner URL.');

    return NextResponse.json({ message: 'Event submitted successfully!', eventId: eventId }, { status: 200 });

  } catch (error: any) {
    console.error('[API /events/create] CRITICAL ERROR:', error);
    console.error('[API /events/create] Error Message:', error.message);
    console.error('[API /events/create] Error Stack:', error.stack);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
