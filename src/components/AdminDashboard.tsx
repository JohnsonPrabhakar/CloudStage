
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  Youtube,
  Loader2,
  WifiOff,
  Film,
  Building,
} from "lucide-react";
import { type Event, type Artist } from "@/lib/types";
import { format } from "date-fns";
import { 
    getPendingEventsListener, 
    updateEventStatus, 
    getPendingArtistsListener,
    approveArtist as approveArtistInDb,
    rejectArtist as rejectArtistInDb,
    getSiteStatus,
    updateSiteStatus,
    getArtistsCount,
    getEventsCount,
    getTicketsCount,
} from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import ManageMovies from "./ManageMovies";

type Stats = {
  artists: number | null;
  events: number | null;
  tickets: number | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [pendingArtists, setPendingArtists] = useState<Artist[]>([]);
  const [hasPendingArtistNotification, setHasPendingArtistNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteStatus, setSiteStatus] = useState<'online' | 'offline'>('online');
  const [stats, setStats] = useState<Stats>({ artists: null, events: null, tickets: null });

  const fetchStats = useCallback(async () => {
    try {
      const [artistsCount, eventsCount, ticketsCount] = await Promise.all([
        getArtistsCount(),
        getEventsCount(),
        getTicketsCount(),
      ]);
      setStats({ artists: artistsCount, events: eventsCount, tickets: ticketsCount });
    } catch (err) {
      // Don't block the UI for stats, just log the error
      console.error("Failed to fetch dashboard stats:", err);
    }
  }, []);

  useEffect(() => {
    let eventsUnsubscribe: (() => void) | undefined;
    let artistsUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@cloudstage.in') {
        setCurrentUser(user);
        
        // Fetch one-time data
        getSiteStatus().then(setSiteStatus);
        fetchStats();

        // Set up real-time listeners
        try {
            eventsUnsubscribe = getPendingEventsListener(setPendingEvents);
            artistsUnsubscribe = getPendingArtistsListener((artists) => {
                setPendingArtists(artists);
                if (artists.length > 0) {
                    setHasPendingArtistNotification(true);
                }
            });
        } catch(err) {
            console.error("Admin dashboard listener error:", err);
            setError("Could not connect to real-time updates. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
      } else {
        router.push("/admin/login");
      }
    });

    return () => {
      authUnsubscribe();
      if (eventsUnsubscribe) eventsUnsubscribe();
      if (artistsUnsubscribe) artistsUnsubscribe();
    };
  }, [router, fetchStats]);

  const handleModeration = async (eventId: string, newStatus: "approved" | "rejected") => {
    try {
      await updateEventStatus(eventId, newStatus);
      toast({
        title: `Event ${newStatus}`,
        description: `The event has been successfully ${newStatus}.`,
      });
    } catch (error) {
       toast({
        title: "Update failed",
        description: "Could not update the event status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleArtistApproval = async (artistId: string) => {
    await approveArtistInDb(artistId);
    toast({ title: "Artist Approved", description: "The artist can now log in." });
  };

  const handleArtistRejection = async (artistId: string) => {
    await rejectArtistInDb(artistId);
    toast({ title: "Artist Rejected", description: "The artist's profile has been removed." });
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push("/admin/login");
  };

  const handleStatusToggle = async (isOnline: boolean) => {
    const newStatus = isOnline ? 'online' : 'offline';
    try {
      setSiteStatus(newStatus);
      await updateSiteStatus(newStatus);
      toast({
          title: "Site Status Updated",
          description: `Bookings are now ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}.`,
      });
    } catch (error) {
      toast({ title: "Update Failed", description: "Could not update site status.", variant: "destructive"});
      setSiteStatus(isOnline ? 'offline' : 'online');
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold">Connection Error</h1>
        <p className="text-muted-foreground mt-2 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  const renderArtistTable = () => {
    if (pendingArtists.length > 0) {
        return (
           <div className="w-full overflow-x-auto">
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
                  <TableRow key={artist.id}>
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
                      <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleArtistApproval(artist.id)}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleArtistRejection(artist.id)}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           </div>
        )
    }
    return <p className="text-muted-foreground text-center py-4">No pending artist registrations.</p>
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
            <div className="flex items-center space-x-2">
                <Switch
                    id="site-status-toggle"
                    checked={siteStatus === 'online'}
                    onCheckedChange={handleStatusToggle}
                    aria-label="Toggle site booking status"
                />
                <Label htmlFor="site-status-toggle" className={siteStatus === 'online' ? 'text-green-500' : 'text-red-500'}>
                    Bookings: {siteStatus === 'online' ? 'Online' : 'Offline'}
                </Label>
            </div>
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
        }
      }}>
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="event-approvals">Event Approvals</TabsTrigger>
          <TabsTrigger value="artist-approvals" className="relative">
            Pending Artists
            {hasPendingArtistNotification && <Bell className="h-4 w-4 absolute top-1 right-1 text-primary animate-pulse"/>}
          </TabsTrigger>
          <TabsTrigger value="manage-movies">Manage Movies</TabsTrigger>
          <TabsTrigger value="revenue">Platform Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Artists</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.artists ?? <Skeleton className="h-8 w-16" />}</div>
                <p className="text-xs text-muted-foreground">Onboarded on the platform</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.events ?? <Skeleton className="h-8 w-16" />}</div>
                <p className="text-xs text-muted-foreground">Created across all artists</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets Issued</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold">{stats.tickets ?? <Skeleton className="h-8 w-16" />}</div>
                 <p className="text-xs text-muted-foreground">For all upcoming events</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (pendingEvents.length + pendingArtists.length)}</div>
                <p className="text-xs text-muted-foreground">{loading ? '...' : `${pendingEvents.length} events & ${pendingArtists.length} artists`}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="event-approvals">
          <Card>
            <CardHeader><CardTitle>Pending Event Approvals</CardTitle></CardHeader>
            <CardContent>
              {pendingEvents.length > 0 ? (
                <div className="w-full overflow-x-auto">
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
                </div>
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
              {renderArtistTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-movies">
            <ManageMovies />
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
              <CardDescription>A real-time overview of key metrics from the Firestore database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Artists</CardDescription>
                        <CardTitle className="text-4xl">{stats.artists ?? "..."}</CardTitle>
                      </CardHeader>
                  </Card>
                  <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Events Created</CardDescription>
                        <CardTitle className="text-4xl">{stats.events ?? "..."}</CardTitle>
                      </CardHeader>
                  </Card>
                   <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Tickets Issued</CardDescription>
                        <CardTitle className="text-4xl">{stats.tickets ?? "..."}</CardTitle>
                      </CardHeader>
                  </Card>
               </div>
               <p className="text-sm text-muted-foreground pt-4">Razorpay integration for revenue breakdown is scheduled for a future development phase.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
