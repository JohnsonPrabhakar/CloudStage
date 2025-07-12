
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// This page now redirects to the unified artist login page.
export default function AdminRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/artist/login');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <p>Redirecting to login...</p>
        </div>
    );
}
