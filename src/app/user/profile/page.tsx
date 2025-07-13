
import { UserProfileForm } from "@/components/UserProfileForm";
import { getUserProfile } from "@/lib/firebase-service";
import { auth }_from_lib_firebase from "firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getAuth } from "firebase-admin/auth";

// Re-initialize a server-side admin app instance if none exists
if (!auth().apps.length) {
    auth().initializeApp();
}

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
    try {
        const sessionCookie = cookies().get("__session")?.value;
        if (!sessionCookie) {
            return null;
        }
        const decodedIdToken = await getAuth().verifySessionCookie(sessionCookie, true);
        return decodedIdToken;
    } catch (error) {
        console.log("Failed to verify session cookie", error);
        return null;
    }
}


export default async function UserProfilePage() {
    const user = await getAuthenticatedUser();

    if (!user) {
        redirect('/user/login?redirect=/user/profile');
    }

    const userProfile = await getUserProfile(user.uid);

    if (!userProfile) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Could Not Load Profile</AlertTitle>
                            <AlertDescription>
                                We were unable to load your user profile data. Please try logging out and back in.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <UserProfileForm initialData={userProfile} />;
}
