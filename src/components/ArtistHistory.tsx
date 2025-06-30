"use client";

import { useRouter } from "next/navigation";
import { type Event } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type ArtistHistoryProps = {
  initialEvents: Event[];
};

export default function ArtistHistory({ initialEvents }: ArtistHistoryProps) {
  const router = useRouter();

  const handleDuplicate = (eventId: string) => {
    router.push(`/artist/create-event?duplicate=${eventId}`);
  };

  const getStatusBadge = (status: Event["moderationStatus"]) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">My Event History</CardTitle>
          <CardDescription>
            A complete log of all events you have submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{event.category}</TableCell>
                    <TableCell>{format(new Date(event.date), "PPP")}</TableCell>
                    <TableCell>{getStatusBadge(event.moderationStatus)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(event.id)}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground space-y-4">
                <p>You haven't created any events yet.</p>
                <Button asChild>
                    <Link href="/artist/create-event">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Event
                    </Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
