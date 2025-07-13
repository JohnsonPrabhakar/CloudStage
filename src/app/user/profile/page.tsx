
"use client";

import UserProfile from "@/components/UserProfile";

export const dynamic = 'force-dynamic';

export default function UserProfilePage() {
    // The UserProfile component now handles all its own data fetching,
    // authentication checks, and state management on the client side.
    return <UserProfile />;
}
