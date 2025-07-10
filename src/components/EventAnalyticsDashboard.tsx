
"use client";

import { useEffect, useState, useMemo } from 'react';
import { type Event, type Ticket, type Artist, type EventCategory } from '@/lib/types';
import { getAllApprovedEventsForAnalytics, getAllTickets, getAllArtists } from '@/lib/firebase-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Ticket as TicketIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, Cell } from "recharts";

const allPossibleCategories: EventCategory[] = [
  "Music", "Devotional / Bhajan / Satsang", "Magic Show", "Meditation / Yoga", "Stand-up Comedy", "Workshop", "Talk"
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// Define the shape of the table data explicitly to break the circular dependency
type AnalyticsTableData = {
    id: string;
    title: string;
    artist: string;
    ticketsSold: number;
    totalRevenue: number;
};

type SortableKeys = keyof AnalyticsTableData;

// Main component
export default function EventAnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [category, setCategory] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'asc' | 'desc' }>({ key: 'totalRevenue', direction: 'desc' });

    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [allTickets, setAllTickets] = useState<Ticket[]>([]);
    const [allArtists, setAllArtists] = useState<Artist[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedEvents, fetchedTickets, fetchedArtists] = await Promise.all([
                    getAllApprovedEventsForAnalytics(),
                    getAllTickets(),
                    getAllArtists(),
                ]);
                setAllEvents(fetchedEvents);
                setAllTickets(fetchedTickets);
                setAllArtists(fetchedArtists);
            } catch (error) {
                console.error("Failed to fetch analytics data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const {
        totalRevenue,
        totalTicketsSold,
        monthlyData,
        categoryData,
        topEventsData,
        topArtistsData,
        sortedTableData
    } = useAnalytics(allEvents, allTickets, allArtists, dateRange, category, sortConfig);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-2 inline" /> : <ArrowDown className="h-4 w-4 ml-2 inline" />;
    };

    if (loading) {
        return <div className="flex justify-center items-center py-12"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><span>Loading analytics...</span></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {allPossibleCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets Sold</CardTitle>
                        <TicketIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">+{totalTicketsSold.toLocaleString()}</div></CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <ChartCard title="Monthly Ticket Sales"><RechartsLineChart data={monthlyData}><CartesianGrid /><XAxis dataKey="month" /><YAxis /><RechartsTooltip /><RechartsLegend /><Line type="monotone" dataKey="tickets" name="Tickets Sold" stroke="#8884d8" /></RechartsLineChart></ChartCard>
                <ChartCard title="Monthly Revenue (₹)"><RechartsLineChart data={monthlyData}><CartesianGrid /><XAxis dataKey="month" /><YAxis /><RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString()}`} /><RechartsLegend /><Line type="monotone" dataKey="revenue" name="Revenue" stroke="#82ca9d" /></RechartsLineChart></ChartCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <ChartCard title="Top 5 Events by Sales"><RechartsBarChart data={topEventsData} layout="vertical"><CartesianGrid /><XAxis type="number" /><YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} interval={0} /><RechartsTooltip /><Bar dataKey="tickets" fill="#8884d8" name="Tickets" /></RechartsBarChart></ChartCard>
                <ChartCard title="Event Category Breakdown"><RechartsPieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip /><RechartsLegend /></RechartsPieChart></ChartCard>
            </div>
            
            <ChartCard title="Top 5 Artists by Sales"><RechartsBarChart data={topArtistsData} layout="vertical"><CartesianGrid /><XAxis type="number" /><YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} interval={0} /><RechartsTooltip /><Bar dataKey="tickets" fill="#82ca9d" name="Tickets" /></RechartsBarChart></ChartCard>

            <Card>
                <CardHeader><CardTitle>Detailed Event Revenue</CardTitle><CardDescription>Click headers to sort.</CardDescription></CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer" onClick={() => requestSort('title')}>Event {getSortIcon('title')}</TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => requestSort('artist')}>Artist {getSortIcon('artist')}</TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => requestSort('ticketsSold')}>Tickets Sold {getSortIcon('ticketsSold')}</TableHead>
                                    <TableHead className="text-right cursor-pointer" onClick={() => requestSort('totalRevenue')}>Revenue {getSortIcon('totalRevenue')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTableData.length > 0 ? sortedTableData.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>{item.artist}</TableCell>
                                        <TableCell className="text-right">{item.ticketsSold.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold">₹{item.totalRevenue.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="text-center">No data for selected period or category.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={300}>{children}</ResponsiveContainer></CardContent>
    </Card>
);

const useAnalytics = (
    events: Event[],
    tickets: Ticket[],
    artists: Artist[],
    dateRange: DateRange | undefined,
    category: string,
    sortConfig: { key: SortableKeys, direction: 'asc' | 'desc' }
) => {
    return useMemo(() => {
        const filteredByDateTickets = tickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            if (!dateRange?.from || !dateRange?.to) return true;
            return ticketDate >= dateRange.from && ticketDate <= dateRange.to;
        });

        const eventsInCategory = events.filter(event => category === 'all' || event.category === category);
        const eventsInCategoryIds = new Set(eventsInCategory.map(e => e.id));

        const finalFilteredTickets = filteredByDateTickets.filter(t => eventsInCategoryIds.has(t.eventId));

        const totalTicketsSold = finalFilteredTickets.length;
        const totalRevenue = finalFilteredTickets.reduce((acc, ticket) => acc + (ticket.pricePaid || 0), 0);

        const monthlySales: { [key: string]: { tickets: number, revenue: number } } = {};
        finalFilteredTickets.forEach(ticket => {
            const month = format(new Date(ticket.createdAt), 'MMM yyyy');
            if (!monthlySales[month]) monthlySales[month] = { tickets: 0, revenue: 0 };
            monthlySales[month].tickets++;
            monthlySales[month].revenue += (ticket.pricePaid || 0);
        });
        const monthlyData = Object.entries(monthlySales)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        const categoryCounts: { [key: string]: number } = {};
        const relevantEventIds = new Set(finalFilteredTickets.map(t => t.eventId));
        const relevantEvents = events.filter(e => relevantEventIds.has(e.id));
        relevantEvents.forEach(event => {
            categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
        });
        const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

        const salesByEvent: Record<string, number> = {};
        finalFilteredTickets.forEach(t => { salesByEvent[t.eventId] = (salesByEvent[t.eventId] || 0) + 1; });
        const topEventsData = Object.entries(salesByEvent)
            .map(([eventId, tickets]) => ({ name: events.find(e => e.id === eventId)?.title || 'Unknown', tickets }))
            .sort((a, b) => b.tickets - a.tickets).slice(0, 5);

        const salesByArtist: Record<string, number> = {};
        finalFilteredTickets.forEach(ticket => {
            const artistId = events.find(e => e.id === ticket.eventId)?.artistId;
            if (artistId) salesByArtist[artistId] = (salesByArtist[artistId] || 0) + 1;
        });
        const topArtistsData = Object.entries(salesByArtist)
            .map(([artistId, tickets]) => ({ name: artists.find(a => a.id === artistId)?.name || 'Unknown', tickets }))
            .sort((a, b) => b.tickets - a.tickets).slice(0, 5);
            
        const tableData: AnalyticsTableData[] = eventsInCategory.map(event => {
            const ticketsSold = salesByEvent[event.id] || 0;
            return {
                id: event.id,
                title: event.title,
                artist: event.artist,
                ticketsSold,
                totalRevenue: ticketsSold * (event.ticketPrice || 0)
            };
        });

        const sortedTableData = [...tableData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return { totalRevenue, totalTicketsSold, monthlyData, categoryData, topEventsData, topArtistsData, tableData, sortedTableData };
    }, [events, tickets, artists, dateRange, category, sortConfig]);
};
