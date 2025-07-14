
"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DatePickerWithRange } from './ui/date-picker-with-range';
import { type DateRange } from 'react-day-picker';
import { subDays, format, startOfDay, isValid } from 'date-fns';
import { type Event, type Ticket, type Artist } from '@/lib/types';
import {
  getAllApprovedEventsForAnalytics,
  getAllTickets,
  getAllArtists,
} from '@/lib/firebase-service';
import { Loader2, DollarSign, Ticket as TicketIcon, CalendarDays, BarChart2, Users, PieChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function EventAnalyticsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedArtistId, setSelectedArtistId] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedEvents, fetchedTickets, fetchedArtists] = await Promise.all([
          getAllApprovedEventsForAnalytics(),
          getAllTickets(),
          getAllArtists(),
        ]);
        setEvents(fetchedEvents);
        setTickets(fetchedTickets);
        setArtists(fetchedArtists);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { filteredTickets, filteredEvents, totalRevenue, ticketsSold, eventsCount } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return { filteredTickets: [], filteredEvents: [], totalRevenue: 0, ticketsSold: 0, eventsCount: 0 };
    }

    const fromDate = startOfDay(dateRange.from);
    const toDate = startOfDay(dateRange.to);

    const filteredEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return isValid(eventDate) && startOfDay(eventDate) >= fromDate && startOfDay(eventDate) <= toDate;
    });

    const eventIds = new Set(filteredEvents.map(e => e.id));

    const filteredTickets = tickets.filter(t => {
        if (!t.createdAt || !isValid(new Date(t.createdAt)) || !eventIds.has(t.eventId)) {
            return false;
        }
        const ticketDate = new Date(t.createdAt);
        return ticketDate >= fromDate && ticketDate <= toDate;
    });

    const totalRevenue = filteredTickets.reduce((sum, ticket) => sum + (ticket.pricePaid || 0), 0);

    return {
        filteredTickets,
        filteredEvents,
        totalRevenue,
        ticketsSold: filteredTickets.length,
        eventsCount: filteredEvents.length,
    }
  }, [events, tickets, dateRange]);

  const artistAnalytics = useMemo(() => {
    if (selectedArtistId === 'all') return null;

    const artistEvents = filteredEvents.filter(e => e.artistId === selectedArtistId);
    const artistEventIds = new Set(artistEvents.map(e => e.id));
    const artistTickets = filteredTickets.filter(t => artistEventIds.has(t.eventId));

    const revenue = artistTickets.reduce((sum, ticket) => sum + ticket.pricePaid, 0);

    return {
      artist: artists.find(a => a.id === selectedArtistId),
      revenue,
      ticketsSold: artistTickets.length,
      eventsCount: artistEvents.length,
    }
  }, [selectedArtistId, filteredEvents, filteredTickets, artists]);


  const revenueByDay = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredTickets.forEach((ticket) => {
      if (!ticket.createdAt) return;
      const day = format(new Date(ticket.createdAt), 'MMM d');
      data[day] = (data[day] || 0) + ticket.pricePaid;
    });
    return Object.entries(data).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
  }, [filteredTickets]);

  const ticketsByCategory = useMemo(() => {
    const data: { [key: string]: number } = {};
     filteredTickets.forEach(ticket => {
        const event = events.find(e => e.id === ticket.eventId);
        if (event) {
            data[event.category] = (data[event.category] || 0) + 1;
        }
    });
    return Object.entries(data).map(([name, tickets]) => ({ name, tickets })).sort((a,b) => b.tickets - a.tickets);
  }, [filteredTickets, events]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            Loading historical data for events, tickets, and revenue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <p>Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold">Platform Analytics</h2>
                <p className="text-muted-foreground">Key metrics for your selected date range.</p>
            </div>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} className="self-start md:self-auto"/>
       </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="text-primary"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                    <TicketIcon className="text-primary"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{ticketsSold.toLocaleString('en-IN')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Events in Range</CardTitle>
                    <CalendarDays className="text-primary"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{eventsCount}</div>
                </CardContent>
            </Card>
       </div>
       
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="text-primary"/>Artist-wise Analytics</CardTitle>
                <CardDescription>Filter by artist to see their performance in the selected date range.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select value={selectedArtistId} onValueChange={setSelectedArtistId}>
                    <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select an artist" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Artists</SelectItem>
                        {artists.map(artist => (
                            <SelectItem key={artist.id} value={artist.id}>{artist.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {artistAnalytics && (
                    <div className="grid gap-4 md:grid-cols-3 pt-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base">Revenue</CardTitle></CardHeader>
                            <CardContent><p className="text-xl font-bold">₹{artistAnalytics.revenue.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base">Tickets Sold</CardTitle></CardHeader>
                            <CardContent><p className="text-xl font-bold">{artistAnalytics.ticketsSold.toLocaleString('en-IN')}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base">Events Held</CardTitle></CardHeader>
                            <CardContent><p className="text-xl font-bold">{artistAnalytics.eventsCount.toLocaleString('en-IN')}</p></CardContent>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value) => `₹${value}`}/>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, "Revenue"]}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Tickets by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={ticketsByCategory} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" stroke="hsl(var(--foreground))" fontSize={12} />
                            <YAxis type="category" dataKey="name" width={100} stroke="hsl(var(--foreground))" fontSize={12}/>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Bar dataKey="tickets" fill="hsl(var(--primary))" name="Tickets Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
