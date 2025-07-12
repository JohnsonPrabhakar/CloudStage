
import CreateEventForm from "@/components/CreateEventForm";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

function CreateEventPageLoader() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
                 <div className="w-full aspect-video relative rounded-lg overflow-hidden border">
                    <Skeleton className="h-full w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="flex justify-start">
                  <Skeleton className="h-12 w-48" />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}


export default function CreateEventPage() {
  return (
    <Suspense fallback={<CreateEventPageLoader />}>
      <CreateEventForm mode="create" />
    </Suspense>
  );
}
