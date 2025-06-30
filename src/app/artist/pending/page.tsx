"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Clock, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";


export default function PendingApprovalPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/artist/login');
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                        <Clock className="h-8 w-8 text-primary"/>
                        Account Pending Approval
                    </CardTitle>
                    <CardDescription>
                        Thank you for your registration!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Your artist profile has been submitted and is currently under review by our admin team.
                        You will be notified via email once your account has been approved. You can then log in to access your dashboard.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        Logout
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
