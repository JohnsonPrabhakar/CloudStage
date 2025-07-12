
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
import { subDays, format, startOfDay } from 'date-fns';
import { type Event, type Ticket } from '@/lib/types';
import {
  getAllApprovedEventsForAnalytics,
  getAllTickets,
} from '@/lib/firebase-service';
import { Loader2, DollarSign, Ticket as TicketIcon, CalendarDays, BarChart2 } from 'lucide-react';

export default function EventAnalyticsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedEvents, fetchedTickets] = await Promise.all([
          getAllApprovedEventsForAnalytics(),
          getAllTickets(),
        ]);
        setEvents(fetchedEvents);
        setTickets(fetchedTickets);
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
        const eventDate = startOfDay(new Date(e.date));
        return eventDate >= fromDate && eventDate <= toDate;
    });

    const eventIds = new Set(filteredEvents.map(e => e.id));

    const filteredTickets = tickets.filter(t => 
        eventIds.has(t.eventId) &&
        t.createdAt && new Date(t.createdAt) >= fromDate && new Date(t.createdAt) <= toDate
    );

    const totalRevenue = filteredTickets.reduce((sum, ticket) => sum + ticket.pricePaid, 0);

    return {
        filteredTickets,
        filteredEvents,
        totalRevenue,
        ticketsSold: filteredTickets.length,
        eventsCount: filteredEvents.length,
    }
  }, [events, tickets, dateRange]);


  const revenueByDay = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredTickets.forEach((ticket) => {
      if (!ticket.createdAt) return;
      const day = format(new Date(ticket.createdAt), 'MMM d');
      data[day] = (data[day] || 0) + ticket.pricePaid;
    });
    return Object.entries(data).map(([name, revenue]) => ({ name, revenue }));
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
                    <DollarSign />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                    <TicketIcon />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{ticketsSold.toLocaleString('en-IN')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Events in Range</CardTitle>
                    <CalendarDays />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{eventsCount}</div>
                </CardContent>
            </Card>
       </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>Total revenue from ticket sales per day.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                            <YAxis stroke="hsl(var(--foreground))"/>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Tickets by Category</CardTitle>
                    <CardDescription>Most popular event categories by tickets sold.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={ticketsByCategory} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" stroke="hsl(var(--foreground))" />
                            <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--foreground))" />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend />
                            <Bar dataKey="tickets" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
