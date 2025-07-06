
import TicketConfirmationForm from "@/components/TicketConfirmationForm";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function ConfirmationPageLoader() {
    return (
        <div className="container mx-auto max-w-2xl p-4 md:p-8 animate-pulse">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 border rounded-lg space-y-3">
                         <Skeleton className="h-6 w-full" />
                         <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

type ConfirmTicketPageProps = {
  params: {
    eventId: string;
  };
};

export default function ConfirmTicketPage({ params }: ConfirmTicketPageProps) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-background flex items-center justify-center p-4">
        <Suspense fallback={<ConfirmationPageLoader />}>
            <TicketConfirmationForm eventId={params.eventId} />
        </Suspense>
    </div>
  );
}
