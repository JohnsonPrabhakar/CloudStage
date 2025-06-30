"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  BarChart,
  Check,
  DollarSign,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { type Event, type Artist } from "@/lib/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  Bar,
  XAxis,
  YAxis,
  BarChart as RechartsBarChart,
} from "@/components/ui/chart";

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
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>(initialEvents);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminLoggedIn = localStorage.getItem("isAdmin") === "true";
      if (!adminLoggedIn) {
        router.push("/admin");
      } else {
        setIsAuthenticated(true);
        const storedPending = localStorage.getItem("pendingEvents");
        if (storedPending) {
          setPendingEvents(JSON.parse(storedPending));
        }
        const storedAll = localStorage.getItem("events");
        if(storedAll) {
           setAllEvents(JSON.parse(storedAll));
        }
      }
    }
  }, [router]);

  const handleApproval = (eventId: string, isApproved: boolean) => {
    const eventToProcess = pendingEvents.find((e) => e.id === eventId);
    if (!eventToProcess) return;

    if (isApproved) {
      const updatedAllEvents = [...allEvents, eventToProcess];
      setAllEvents(updatedAllEvents);
      localStorage.setItem("events", JSON.stringify(updatedAllEvents));
    }

    const updatedPendingEvents = pendingEvents.filter((e) => e.id !== eventId);
    setPendingEvents(updatedPendingEvents);
    localStorage.setItem(
      "pendingEvents",
      JSON.stringify(updatedPendingEvents)
    );
  };
  
  const boostedEvents = allEvents.filter(e => e.isBoosted);
  const totalRevenue = allEvents.reduce((acc, event) => acc + event.ticketPrice * (Math.floor(Math.random() * 500) + 50), 0);

  const chartData = useMemo(() => {
    return initialArtists.map(artist => ({
        artist: artist.name,
        revenue: allEvents.filter(e => e.artistId === artist.id).reduce((acc, event) => acc + event.ticketPrice * (Math.floor(Math.random() * 500) + 50), 0)
    }));
  }, [allEvents, initialArtists]);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  };


  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-4xl font-bold">Admin Dashboard</h1>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialArtists.length}</div>
            <p className="text-xs text-muted-foreground">{initialArtists.filter(a => a.isPremium).length} premium</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boosted Events</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{boostedEvents.length}</div>
            <p className="text-xs text-muted-foreground">Active boosts</p>
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
                <CardHeader>
                    <CardTitle>Revenue by Artist</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <RechartsBarChart data={chartData} accessibilityLayer>
                            <XAxis dataKey="artist" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                             <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Artists</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Artist</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialArtists.map((artist) => (
                            <TableRow key={artist.id}>
                                <TableCell>{artist.name}</TableCell>
                                <TableCell>
                                <Badge variant={artist.isPremium ? "default" : "outline"}>
                                    {artist.isPremium ? "Premium" : "Standard"}
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
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Event Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{event.artist}</TableCell>
                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-500 hover:text-green-600"
                        onClick={() => handleApproval(event.id, true)}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleApproval(event.id, false)}
                      >
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

    </div>
  );
}
