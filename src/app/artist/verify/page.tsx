import ArtistVerificationForm from "@/components/ArtistVerificationForm";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

function VerificationPageLoader() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-24 w-full" />
                <div className="flex justify-start">
                  <Skeleton className="h-12 w-48" />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}


export default function ArtistVerifyPage() {
  return (
    <Suspense fallback={<VerificationPageLoader />}>
      <ArtistVerificationForm />
    </Suspense>
  );
}
