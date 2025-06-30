
"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { type Event, type Artist } from "@/lib/types";
import { format } from "date-fns";
import { 
    getPendingEvents, 
    updateEventStatus, 
    getPendingArtists as getPendingArtistsFromDb,
    approveArtist as approveArtistInDb,
    rejectArtist as rejectArtistInDb,
} from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [pendingArtists, setPendingArtists] = useState<Artist[]>([]);
  const [hasPendingArtistNotification, setHasPendingArtistNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
     setLoading(true);
     setError(null);
     try {
       const events = await getPendingEvents();
       setPendingEvents(events);
       const artists = await getPendingArtistsFromDb();
       setPendingArtists(artists);
       
       if(artists.length > 0) {
          setHasPendingArtistNotification(true);
       }
     } catch (err) {
        console.error("Failed to load admin data:", err);
        setError("Could not load dashboard data. Please check your internet connection and try again.");
     } finally {
        setLoading(false);
     }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@cloudstage.in') {
        setIsAuthenticated(true);
        refreshData();
      } else {
        router.push("/admin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // NOTE: Revenue and boosted event data is now static or mocked
  const revenueData = { total: 0 }; // Placeholder
  
  const handleModeration = async (eventId: string, newStatus: "approved" | "rejected") => {
    try {
      await updateEventStatus(eventId, newStatus);
      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
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
    setPendingArtists(prev => prev.filter(a => a.id !== artistId));
    toast({ title: "Artist Approved", description: "The artist can now log in." });
  };

  const handleArtistRejection = async (artistId: string) => {
    await rejectArtistInDb(artistId);
    setPendingArtists(prev => prev.filter(a => a.id !== artistId));
    toast({ title: "Artist Rejected", description: "The artist's profile has been removed." });
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push("/admin");
  };
  
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold">Connection Error</h1>
        <p className="text-muted-foreground mt-2 mb-6">{error}</p>
        <Button onClick={refreshData}>
          Try Again
        </Button>
      </div>
    );
  }
  
  const renderArtistTable = () => {
    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }
    if (pendingArtists.length > 0) {
        return (
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
        )
    }
    return <p className="text-muted-foreground text-center py-4">No pending artist registrations.</p>
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
                <p className="text-xs text-muted-foreground">(Mock Data)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Artists</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingArtists.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boosted Events</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold">...</div>
                 <p className="text-xs text-muted-foreground">(Fetching...)</p>
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
        </TabsContent>

        <TabsContent value="event-approvals">
          <Card>
            <CardHeader><CardTitle>Pending Event Approvals</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p>Loading events...</p> : pendingEvents.length > 0 ? (
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
              {renderArtistTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Ad Breakdown</CardTitle>
              <CardDescription>This data is currently mocked and not connected to Firestore.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">Revenue charts and stats will be re-enabled after backend integration for monetization is complete.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
