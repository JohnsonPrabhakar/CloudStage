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
  LogOut,
  Upload,
  Bell,
  Facebook,
  Instagram,
  Youtube
} from "lucide-react";
import { type Event, type Artist, type PendingArtist } from "@/lib/types";
import { format } from "date-fns";
import { getArtists, getEvents, getPendingArtists, approveArtist, rejectArtist } from "@/lib/mock-data";
import dynamic from "next/dynamic";

const ChartContainer = dynamic(
  () => import("@/components/ui/chart").then((mod) => mod.ChartContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const ChartTooltipContent = dynamic(
  () => import("@/components/ui/chart").then((mod) => mod.ChartTooltipContent),
  { ssr: false }
);
const ChartTooltip = dynamic(
  () => import("@/components/ui/chart").then((mod) => mod.ChartTooltip),
  { ssr: false }
);
const ChartLegend = dynamic(
  () => import("@/components/ui/chart").then((mod) => mod.ChartLegend),
  { ssr: false }
);
const ChartLegendContent = dynamic(
  () => import("@/components/ui/chart").then((mod) => mod.ChartLegendContent),
  { ssr: false }
);


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
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [adImpressions, setAdImpressions] = useState(0);
  const [hasPendingArtistNotification, setHasPendingArtistNotification] = useState(false);


  const refreshData = () => {
     setEvents(getEvents());
     setArtists(getArtists());
     setPendingArtists(getPendingArtists());
     if(localStorage.getItem("pendingArtistNotifications") === "true") {
        setHasPendingArtistNotification(true);
     }
  }

  useEffect(() => {
    setIsClient(true);
    setAdImpressions(Math.floor(Math.random() * 50000) + 10000);
    if (typeof window !== "undefined") {
      const adminLoggedIn = localStorage.getItem("isAdmin") === "true";
      if (!adminLoggedIn) {
        router.push("/admin");
      } else {
        setIsAuthenticated(true);
        refreshData();
      }
    }
  }, [router]);

  const { pendingEvents, boostedEventsCount, revenueData, revenueByArtist } =
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

      const artistRevenue = artists.map(artist => {
          const artistTicketRevenue = approvedEvents
            .filter(e => e.artistId === artist.id)
            .reduce((acc, e) => acc + (e.ticketPrice * (e.ticketsSold || 0)), 0);
          
          const artistBoostRevenue = events
            .filter(e => e.artistId === artist.id && e.isBoosted && e.boostAmount)
            .reduce((acc, e) => acc + (e.boostAmount || 0), 0);

          return {
              name: artist.name,
              revenue: artistTicketRevenue + artistBoostRevenue
          }
      });

      return {
        pendingEvents: pending,
        boostedEventsCount: boostedCount,
        revenueData: {
          ticketRevenue,
          boostRevenue,
          premiumRevenue,
          total: ticketRevenue + boostRevenue + premiumRevenue,
        },
        revenueByArtist: artistRevenue,
      };
    }, [events, artists]);

  const handleModeration = (eventId: string, newStatus: "approved" | "rejected") => {
    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, moderationStatus: newStatus } : e
    );
    setEvents(updatedEvents);
    localStorage.setItem("events", JSON.stringify(updatedEvents));
  };
  
  const handleArtistApproval = (email: string) => {
    approveArtist(email);
    refreshData();
  };

  const handleArtistRejection = (email: string) => {
    rejectArtist(email);
    refreshData();
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isAdmin");
      router.push("/admin");
    }
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
        <div className="flex items-center gap-2">
            <Button asChild>
                <Link href="/movies/upload">
                    <Upload className="mr-2 h-4 w-4" /> Upload Movie
                </Link>
            </Button>
            <Button asChild>
                <Link href="/admin/boosted">
                    <TrendingUp className="mr-2 h-4 w-4" /> View Boosted Events
                </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={(value) => {
        if (value === 'artist-approvals') {
          setHasPendingArtistNotification(false);
          localStorage.setItem("pendingArtistNotifications", "false");
        }
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="event-approvals">Event Approvals</TabsTrigger>
          <TabsTrigger value="artist-approvals" className="relative">
            Pending Artists
            {hasPendingArtistNotification && <Bell className="h-4 w-4 absolute top-1 right-1 text-primary animate-pulse"/>}
          </TabsTrigger>
          <TabsTrigger value="revenue">Revenue & Ads</TabsTrigger>
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
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingEvents.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8">
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
        </TabsContent>

        <TabsContent value="event-approvals">
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

        <TabsContent value="artist-approvals">
          <Card>
            <CardHeader><CardTitle>Pending Artist Approvals</CardTitle></CardHeader>
            <CardContent>
              {pendingArtists.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artist</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Socials</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingArtists.map((artist) => (
                      <TableRow key={artist.email}>
                        <TableCell>
                            <div className="font-medium">{artist.name}</div>
                            <div className="text-sm text-muted-foreground">{artist.email}</div>
                             <div className="text-sm text-muted-foreground">{artist.phone}</div>
                        </TableCell>
                         <TableCell className="text-sm">
                            <div>Category: {artist.category} ({artist.subCategory})</div>
                            <div>Experience: {artist.experience} years</div>
                            <div>Location: {artist.location}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                             <Link href={artist.youtubeUrl} target="_blank"><Youtube className="h-5 w-5"/></Link>
                             <Link href={artist.instagramUrl} target="_blank"><Instagram className="h-5 w-5"/></Link>
                             <Link href={artist.facebookUrl} target="_blank"><Facebook className="h-5 w-5"/></Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleArtistApproval(artist.email)}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleArtistRejection(artist.email)}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No pending artist registrations.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Ad Breakdown</CardTitle>
              <CardDescription>Mock data from all monetization sources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
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
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adImpressions.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

               <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Revenue by Artist</CardTitle>
                    <CardDescription>
                        A breakdown of revenue generated per artist.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="h-[300px] w-full">
                        {isClient && (
                           <ChartContainer config={{
                            revenue: {
                              label: "Revenue",
                              color: "hsl(var(--chart-1))",
                            },
                          }}>
                              <BarChart data={revenueByArtist}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                  <YAxis />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <ChartLegend content={<ChartLegendContent />} />
                                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                              </BarChart>
                          </ChartContainer>
                        )}
                    </div>
                </CardContent>
              </Card>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
