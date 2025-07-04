
import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const bannerFile = formData.get('banner') as File | null;
    const artistId = formData.get('artistId') as string | null;
    const eventId = formData.get('eventId') as string | null;

    if (!bannerFile || !artistId || !eventId) {
      return NextResponse.json({ message: 'Missing required fields (banner, artistId, eventId).' }, { status: 400 });
    }

    // 1. Upload the file to Firebase Storage
    const bannerPath = `artists/${artistId}/events/${eventId}/banner.jpg`;
    const storageRef = ref(storage, bannerPath);
    
    // Convert File to ArrayBuffer for upload
    const buffer = await bannerFile.arrayBuffer();
    await uploadBytes(storageRef, buffer, { contentType: bannerFile.type });
    
    const downloadURL = await getDownloadURL(storageRef);

    // 2. Update the event document in Firestore with the new banner URL
    const eventDocRef = doc(db, 'events', eventId);
    await updateDoc(eventDocRef, {
      bannerUrl: downloadURL,
    });

    return NextResponse.json({ message: 'Banner uploaded successfully.', bannerUrl: downloadURL }, { status: 200 });

  } catch (error: any) {
    console.error('API Banner Upload Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
