
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Event, type UserProfile } from "@/lib/types";
import { getEventById, createTicket, getUserProfile } from "@/lib/firebase-service";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Calendar, Ticket, AlertTriangle, ArrowLeft, LogIn, User as UserIcon } from "lucide-react";
import { format } from 'date-fns';

export default function TicketConfirmationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        // If there's no user, we don't need to load a profile.
        // The UI will handle showing the login prompt.
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);
  
  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
        try {
            const fetchedEvent = await getEventById(eventId);
            if (fetchedEvent) {
                setEvent(fetchedEvent);
            } else {
                toast({ variant: 'destructive', title: 'Event Not Found' });
                router.push('/');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load event details.' });
            router.push('/');
        }
    };
    
    fetchEvent();
  }, [eventId, router, toast]);

  // Combined loading effect
  useEffect(() => {
    // We are done loading if we have fetched the event AND either
    // we have a user and their profile, OR we know there is no user.
    if (event !== null && (userProfile !== null || user === null)) {
      setLoading(false);
    }
  }, [event, user, userProfile]);

  async function handleConfirmPurchase() {
    setIsProcessing(true);
    try {
      if (!event) {
          throw new Error("Event data is not available.");
      }
       if (!user || !userProfile) {
          throw new Error("You must be logged in to purchase a ticket.");
      }

      await createTicket(
        user.uid,
        event.id,
        event.ticketPrice,
        {
          buyerName: userProfile.fullName,
          buyerEmail: userProfile.email,
          buyerPhone: userProfile.phone || '',
        }
      );
      
      toast({
          title: "Booking Successful!",
          description: `Your ticket for "${event.title}" has been confirmed. You'll be redirected shortly.`,
      });
      setTimeout(() => {
          router.push("/my-tickets");
          router.refresh();
      }, 3000);

    } catch (error: any) {
      console.error("Booking failed:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
        setIsProcessing(false);
    }
  }

  if (loading) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Confirm Your Ticket</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-12">
              <Loader2 className="mr-2 h-8 w-8 animate-spin" />
              <p>Loading your details...</p>
            </CardContent>
        </Card>
    );
  }
  
  if (!user) {
    return (
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <CardTitle className="flex justify-center items-center gap-2"><LogIn className="text-primary"/>Please Log In</CardTitle>
                <CardDescription>You need to be logged in to purchase a ticket.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button asChild>
                    <Link href={`/user/login?redirect=/confirm-ticket/${eventId}`}>Log In or Register</Link>
                </Button>
                 <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event
                </Button>
            </CardContent>
          </Card>
    );
  }
  
  if (!event || !userProfile) {
    return (
        <Card className="w-full max-w-2xl">
             <CardHeader>
                <CardTitle>Error</CardTitle>
            </CardHeader>
             <CardContent>
                <p>Could not load event or user details. Please try again.</p>
             </CardContent>
        </Card>
    )
  }

  if (event.status === 'past') {
      return (
          <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <CardTitle className="flex justify-center items-center gap-2"><AlertTriangle className="text-destructive"/>This Event is Over</CardTitle>
                <CardDescription>Bookings are no longer available for past events.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event Details
                </Button>
            </CardContent>
          </Card>
      );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Confirm Your Ticket Purchase</CardTitle>
        <CardDescription>
          Review the details below. Your ticket will be linked to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
            <h3 className="font-bold text-lg">{event.title}</h3>
            <p className="text-sm text-muted-foreground">by {event.artist}</p>
            <div className="flex justify-between items-center mt-2 text-sm">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {format(new Date(event.date), 'PPP')}</span>
                <span className="flex items-center gap-2 font-semibold"><Ticket className="h-4 w-4"/> ₹{event.ticketPrice.toFixed(2)}</span>
            </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
             <h3 className="font-bold text-lg flex items-center gap-2"><UserIcon className="h-5 w-5"/> Your Details</h3>
             <p className="text-sm"><strong>Name:</strong> {userProfile?.fullName}</p>
             <p className="text-sm"><strong>Email:</strong> {userProfile?.email}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" disabled={isProcessing} onClick={handleConfirmPurchase}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm & Pay ₹${event.ticketPrice.toFixed(2)}`
            )}
          </Button>
          <Button variant="link" className="w-full" onClick={() => router.back()} disabled={isProcessing}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
