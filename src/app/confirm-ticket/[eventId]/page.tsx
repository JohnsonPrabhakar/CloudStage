
"use client";

import { Suspense } from "react";
import TicketConfirmationForm from "@/components/TicketConfirmationForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

function ConfirmTicketPageLoader() {
    return (
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Card className="w-full max-w-2xl animate-pulse">
                <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                <CardContent className="space-y-6">
                    <div className="h-20 w-full rounded-md bg-muted" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function ConfirmTicketPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <Suspense fallback={<ConfirmTicketPageLoader />}>
        {eventId && <TicketConfirmationForm eventId={eventId} />}
      </Suspense>
    </div>
  );
}
