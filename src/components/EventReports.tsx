"use client";

import { useEffect, useState, useMemo } from 'react';
import { type Event, type Ticket } from '@/lib/types';
import { getCompletedEventsForReport, getAllTickets } from '@/lib/firebase-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type ReportData = {
    event: Event;
    ticketCount: number;
    revenue: number;
}

export default function EventReports() {
    const [events, setEvents] = useState<Event[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedEvents, fetchedTickets] = await Promise.all([
                    getCompletedEventsForReport(),
                    getAllTickets(),
                ]);
                setEvents(fetchedEvents);
                setTickets(fetchedTickets);
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const reportData: ReportData[] = useMemo(() => {
        if (!events.length) return [];

        const ticketsByEvent = tickets.reduce((acc, ticket) => {
            acc[ticket.eventId] = (acc[ticket.eventId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return events.map(event => {
            const ticketCount = ticketsByEvent[event.id] || 0;
            return {
                event,
                ticketCount,
                revenue: ticketCount * event.ticketPrice
            };
        });
    }, [events, tickets]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span>Loading reports...</span>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Event Booking & Revenue Reports</CardTitle>
            </CardHeader>
            <CardContent>
                {reportData.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Event Code</TableHead>
                                <TableHead>Artist</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Ticket Price</TableHead>
                                <TableHead className="text-right">Tickets Sold</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map(({ event, ticketCount, revenue }) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.title}</TableCell>
                                    <TableCell>{event.eventCode}</TableCell>
                                    <TableCell>{event.artist}</TableCell>
                                    <TableCell>{format(new Date(event.date), 'PPP')}</TableCell>
                                    <TableCell className="text-right">₹{event.ticketPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{ticketCount}</TableCell>
                                    <TableCell className="text-right font-bold">₹{revenue.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-12">No completed events to report.</p>
                )}
            </CardContent>
        </Card>
    );
}
