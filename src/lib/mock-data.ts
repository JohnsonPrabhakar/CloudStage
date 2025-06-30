import { type Event, type Artist } from "./types";

// This file used to contain mock data and localStorage logic for tickets.
// That functionality has been migrated to firebase-service.ts.
// It is kept for the public-facing artist mock data.

// Legacy functions for mock-data based artist fetching (used in non-auth pages like event details)
// In a full-stack app, this would be replaced with a public API endpoint.
const artists: Artist[] = [
    {
        id: 'artist1',
        name: 'The Rockers',
        email: 'rockers@test.com',
        isPremium: false,
        type: 'Band',
        genres: ['Rock', 'Hard Rock'],
        youtubeUrl: 'https://youtube.com',
        instagramUrl: 'https://instagram.com',
        facebookUrl: 'https://facebook.com',
        isApproved: true,
        phone: '1234567890',
        location: 'Mumbai, India',
        about: 'Just a band trying to make it.',
        profilePictureUrl: 'https://placehold.co/128x128.png',
        experience: 5,
        category: 'Music',
        subCategory: 'Rock',
    },
];
export const getArtistById = (id: string): Artist | undefined => artists.find(a => a.id === id);
