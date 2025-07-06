
"use client";

import { useEffect, useState, useMemo } from 'react';
import { type Event, type Ticket, type Artist } from '@/lib/types';
import { getCompletedEventsForReport, getAllTickets, getAllArtists } from '@/lib/firebase-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, BarChartHorizontal } from 'lucide-react';
import { format } from 'date-fns';

type PerEventReportData = {
    event: Event;
    ticketCount: number;
    revenue: number;
}

type PerArtistReportData = {
    artist: Artist;
    eventCount: number;
    totalTicketsSold: number;
    totalRevenue: number;
}

export default function EventReports() {
    const [events, setEvents] = useState<Event[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedEvents, fetchedTickets, fetchedArtists] = await Promise.all([
                    getCompletedEventsForReport(),
                    getAllTickets(),
                    getAllArtists(),
                ]);
                setEvents(fetchedEvents);
                setTickets(fetchedTickets);
                setArtists(fetchedArtists);
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { perEventData, perArtistData } = useMemo(() => {
        if (!events.length || !artists.length) return { perEventData: [], perArtistData: [] };

        const ticketsByEvent = tickets.reduce((acc, ticket) => {
            acc[ticket.eventId] = (acc[ticket.eventId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const perEventData: PerEventReportData[] = events.map(event => {
            const ticketCount = ticketsByEvent[event.id] || 0;
            return {
                event,
                ticketCount,
                revenue: ticketCount * event.ticketPrice
            };
        });

        const artistReportMap: Record<string, { eventCount: number, totalTicketsSold: number, totalRevenue: number }> = {};
        for(const artist of artists) {
            artistReportMap[artist.id] = { eventCount: 0, totalTicketsSold: 0, totalRevenue: 0 };
        }

        for (const report of perEventData) {
            const artistId = report.event.artistId;
            if(artistReportMap[artistId]) {
                artistReportMap[artistId].eventCount += 1;
                artistReportMap[artistId].totalTicketsSold += report.ticketCount;
                artistReportMap[artistId].totalRevenue += report.revenue;
            }
        }
        
        const perArtistData: PerArtistReportData[] = artists.map(artist => ({
            artist,
            ...artistReportMap[artist.id]
        })).filter(a => a.eventCount > 0)
           .sort((a,b) => b.totalRevenue - a.totalRevenue);

        return { perEventData, perArtistData };

    }, [events, tickets, artists]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span>Loading reports...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Artist Performance Summary
                    </CardTitle>
                    <CardDescription>Aggregated performance metrics for each artist.</CardDescription>
                </CardHeader>
                <CardContent>
                    {perArtistData.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Artist</TableHead>
                                    <TableHead className="text-right">Total Events</TableHead>
                                    <TableHead className="text-right">Total Tickets Sold</TableHead>
                                    <TableHead className="text-right">Total Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {perArtistData.map(({ artist, eventCount, totalTicketsSold, totalRevenue }) => (
                                    <TableRow key={artist.id}>
                                        <TableCell className="font-medium">{artist.name}</TableCell>
                                        <TableCell className="text-right">{eventCount}</TableCell>
                                        <TableCell className="text-right">{totalTicketsSold}</TableCell>
                                        <TableCell className="text-right font-bold">₹{totalRevenue.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <p className="text-center text-muted-foreground py-12">No artist performance data available yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChartHorizontal className="h-5 w-5" />
                        Detailed Event Report
                    </CardTitle>
                    <CardDescription>A complete breakdown of all completed events.</CardDescription>
                </CardHeader>
                <CardContent>
                    {perEventData.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Artist</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Ticket Price</TableHead>
                                    <TableHead className="text-right">Tickets Sold</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {perEventData.map(({ event, ticketCount, revenue }) => (
                                    <TableRow key={event.id}>
                                        <TableCell className="font-medium">{event.title}</TableCell>
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
        </div>
    );
}
