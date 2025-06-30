"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Check,
  DollarSign,
  Sparkles,
  Users,
  X,
  Crown,
  TrendingUp,
  Ticket,
  ChevronLeft,
  Eye,
  Clock,
} from "lucide-react";
import { type Event, type Artist } from "@/lib/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Bar,
  XAxis,
  YAxis,
  BarChart as RechartsBarChart,
} from "@/components/ui/chart";
import { format } from "date-fns";

type AdminDashboardProps = {
  initialEvents: Event[];
  initialArtists: Artist[];
};

export default function AdminDashboard({
  initialEvents,
  initialArtists,
}: AdminDashboardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminLoggedIn = localStorage.getItem("isAdmin") === "true";
      if (!adminLoggedIn) {
        router.push("/admin");
      } else {
        setIsAuthenticated(true);
        // Re-fetch from localStorage to get the latest data
        const storedEvents = localStorage.getItem("events");
        if (storedEvents) setEvents(JSON.parse(storedEvents));

        const storedArtists = localStorage.getItem("artists");
        if (storedArtists) setArtists(JSON.parse(storedArtists));
      }
    }
  }, [router]);

  const { pendingEvents, boostedEventsCount, revenueData, artistChartData } =
    useMemo(() => {
      const pending = events.filter((e) => e.moderationStatus === "pending");
      const boostedCount = events.filter((e) => e.isBoosted).length;

      const approvedEvents = events.filter(
        (e) => e.moderationStatus === "approved"
      );
      
      const ticketRevenue = approvedEvents.reduce(
        (acc, event) => acc + (event.ticketPrice * (event.ticketsSold || 0)),
        0
      );
      
      const boostRevenue = events
        .filter((e) => e.isBoosted && e.boostAmount)
        .reduce((acc, event) => acc + (event.boostAmount || 0), 0);
      const premiumRevenue =
        artists.filter((a) => a.isPremium).length * 149;

      const artistRevenueMap = new Map<string, number>();
      approvedEvents.forEach(event => {
        const revenue = event.ticketPrice * (event.ticketsSold || 0);
        artistRevenueMap.set(event.artistId, (artistRevenueMap.get(event.artistId) || 0) + revenue);
      });

      const chartData = artists.map(artist => ({
        artist: artist.name,
        revenue: artistRevenueMap.get(artist.id) || 0
      }));

      return {
        pendingEvents: pending,
        boostedEventsCount: boostedCount,
        revenueData: {
          ticketRevenue,
          boostRevenue,
          premiumRevenue,
          total: ticketRevenue + boostRevenue + premiumRevenue,
        },
        artistChartData: chartData,
      };
    }, [events, artists]);

  const handleModeration = (eventId: string, newStatus: "approved" | "rejected") => {
    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, moderationStatus: newStatus } : e
    );
    setEvents(updatedEvents);
    localStorage.setItem("events", JSON.stringify(updatedEvents));
  };
  
  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center"><p>Redirecting...</p></div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        </div>
        <Button asChild>
          <Link href="/admin/boosted">
            <TrendingUp className="mr-2 h-4 w-4" /> View Boosted Events
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Event Approvals</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{revenueData.total.toLocaleString("en-IN")}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Artists</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{artists.filter((a) => a.isPremium).length}</div>
                <p className="text-xs text-muted-foreground">out of {artists.length} artists</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boosted Events</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{boostedEventsCount}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Events</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingEvents.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Revenue by Artist</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <RechartsBarChart data={artistChartData} accessibilityLayer>
                      <XAxis dataKey="artist" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader><CardTitle>All Artists</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Artist</TableHead><TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {artists.map((artist) => (
                        <TableRow key={artist.id}>
                          <TableCell><Link className="hover:underline" href={`/artist/${artist.id}`}>{artist.name}</Link></TableCell>
                          <TableCell>
                            <Badge variant={artist.isPremium ? "default" : "outline"} className={artist.isPremium ? 'bg-amber-500' : ''}>
                              {artist.isPremium ? <><Crown className="mr-2 h-3 w-3"/> Premium</> : "Standard"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader><CardTitle>Pending Event Approvals</CardTitle></CardHeader>
            <CardContent>
              {pendingEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">by {event.artist}</div>
                             <div className="text-sm text-muted-foreground">{format(new Date(event.date), "PPP")}</div>
                        </TableCell>
                         <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><Ticket className="h-4 w-4"/><span>{event.ticketsSold || 0} sold</span></div>
                          <div className="flex items-center gap-2"><Eye className="h-4 w-4"/><span>{event.views || 0} views</span></div>
                          <div className="flex items-center gap-2"><Clock className="h-4 w-4"/><span>{event.watchTime || 0} min watch time</span></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleModeration(event.id, "approved")}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleModeration(event.id, "rejected")}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No pending events.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Mock revenue data from all sources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{revenueData.ticketRevenue.toLocaleString("en-IN")}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Boost Income</CardTitle>
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{revenueData.boostRevenue.toLocaleString("en-IN")}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Premium Subscriptions</CardTitle>
                    <Crown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{revenueData.premiumRevenue.toLocaleString("en-IN")}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
