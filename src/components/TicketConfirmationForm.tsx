
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Event } from "@/lib/types";
import { getEventById } from "@/lib/firebase-service";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Calendar, Ticket, AlertTriangle, ArrowLeft } from "lucide-react";
import { format } from 'date-fns';
import Script from "next/script";
import { createCashfreeOrder } from "@/lib/actions";

const formSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
});

type FormValues = z.infer<typeof formSchema>;

declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function TicketConfirmationForm({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });
  
  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser); // Set user to the logged-in user or null for guests
        if (currentUser) {
            // Pre-fill form if user is logged in
            form.setValue('email', currentUser.email || '');
            if (currentUser.displayName) {
                form.setValue('fullName', currentUser.displayName);
            }
        }
    });

    const fetchEvent = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };
    
    fetchEvent();

    return () => authUnsubscribe();
  }, [eventId, router, toast, form]);

  async function onSubmit(values: FormValues) {
    setIsProcessingPayment(true);
    try {
      let userIdForTicket: string;
      if (user) {
        userIdForTicket = user.uid;
      } else {
        const userCredential = await signInAnonymously(auth);
        userIdForTicket = userCredential.user.uid;
      }
      
      if (!event) {
          throw new Error("Event data is not available.");
      }

      const orderResponse = await createCashfreeOrder({
        amount: event.ticketPrice,
        receiptId: `TICKET_${event.eventCode}_${Date.now()}`,
        customer_name: values.fullName,
        customer_email: values.email,
        customer_phone: values.phone,
        userId: userIdForTicket,
        eventId: event.id,
      });

      if (!orderResponse.success || !orderResponse.order) {
        throw new Error(orderResponse.error || 'Failed to create payment order.');
      }

      const { order } = orderResponse;
      const cashfree = new window.Cashfree(order.payment_session_id);

      cashfree.checkout({
        paymentMethod: "card",
        onSuccess: (data: any) => {
          console.log("Cashfree payment success (client-side):", data);
          toast({
            title: "Payment Successful!",
            description: "Your ticket has been booked. You will be redirected shortly.",
          });
          // The webhook will handle creating the ticket in the database.
          setTimeout(() => {
            router.push("/my-tickets");
          }, 3000);
        },
        onFailure: (data: any) => {
          console.error("Cashfree payment failure (client-side):", data);
          toast({
              title: 'Payment Failed',
              description: 'Something went wrong. Please try again.',
              variant: 'destructive',
          });
          setIsProcessingPayment(false);
        },
        onClose: () => {
           console.log("Payment form closed by user.");
           setIsProcessingPayment(false);
        }
      });

    } catch (error: any) {
      console.error("Booking failed:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsProcessingPayment(false);
    }
  }

  if (loading || !event) {
    return (
        <Card className="w-full max-w-2xl animate-pulse">
            <CardHeader><div className="h-8 w-3/4 rounded-md bg-muted" /></CardHeader>
            <CardContent><div className="h-40 w-full rounded-md bg-muted" /></CardContent>
        </Card>
    );
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
    <>
    <Script
        id="cashfree-checkout-js"
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
    />
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Confirm Your Ticket Purchase</CardTitle>
        <CardDescription>
          Please verify your details below before proceeding. Your ticket will be sent to this email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 mb-6 bg-muted/30">
            <h3 className="font-bold text-lg">{event.title}</h3>
            <p className="text-sm text-muted-foreground">by {event.artist}</p>
            <div className="flex justify-between items-center mt-2 text-sm">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {format(new Date(event.date), 'PPP')}</span>
                <span className="flex items-center gap-2 font-semibold"><Ticket className="h-4 w-4"/> ₹{event.ticketPrice.toFixed(2)}</span>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full" disabled={isProcessingPayment}>
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm & Pay ₹${event.ticketPrice.toFixed(2)}`
              )}
            </Button>
             <Button variant="link" className="w-full" onClick={() => router.back()}>Cancel</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    </>
  );
}
