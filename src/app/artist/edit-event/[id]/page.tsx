
import CreateEventForm from "@/components/CreateEventForm";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { getEventById } from "@/lib/firebase-service";

export const dynamic = 'force-dynamic';

function EditEventPageLoader() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <div className="flex justify-start">
                  <Skeleton className="h-12 w-48" />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

// This is a server component to fetch initial data
async function EditEventFormWrapper({ eventId }: { eventId: string }) {
    const event = await getEventById(eventId);

    if (!event) {
        return (
            <div className="container mx-auto p-8 text-center">
                <h1 className="text-3xl font-bold">Event not found</h1>
                <p className="text-muted-foreground mt-2">The event you are trying to edit does not exist.</p>
            </div>
        );
    }
    return <CreateEventForm mode="edit" initialData={event} />;
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<EditEventPageLoader />}>
      <EditEventFormWrapper eventId={params.id} />
    </Suspense>
  );
}
