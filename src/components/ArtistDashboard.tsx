"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type Event } from "@/lib/types";
import { PlusCircle, Crown, CheckCircle } from "lucide-react";
import { format } from "date-fns";

type ArtistDashboardProps = {
  initialEvents: Event[];
};

export default function ArtistDashboard({ initialEvents }: ArtistDashboardProps) {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<
    Record<string, { audience: number; revenue: number }>
  >({});

  useEffect(() => {
    // Mocking artist-specific events. In a real app, this would be a filtered API call.
    // For now, we'll just take some of the past events.
    const pastEvents = initialEvents
      .filter((e) => e.status === "past" && e.artistId === "artist1")
      .slice(0, 3);
    setMyEvents(pastEvents);

    // Generate stats on client to avoid hydration mismatch
    if (typeof window !== "undefined") {
      const stats: Record<string, { audience: number; revenue: number }> = {};
      pastEvents.forEach((event) => {
        stats[event.id] = {
          audience: Math.floor(Math.random() * 5000 + 1000),
          revenue: event.ticketPrice * Math.floor(Math.random() * 500 + 100),
        };
      });
      setEventStats(stats);
    }
  }, [initialEvents]);

  const premiumPlans = [
    {
      name: "Pro Artist",
      price: "$29/mo",
      features: [
        "Unlimited Events",
        "HD Streaming",
        "Advanced Analytics",
        "Priority Support",
      ],
      isCurrent: false,
    },
    {
      name: "Legend",
      price: "$79/mo",
      features: [
        "All Pro features",
        "4K Streaming",
        "Dedicated Support",
        "Merch Integration",
      ],
      isCurrent: false,
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-4xl font-bold">Artist Dashboard</h1>
            <p className="text-muted-foreground">Manage your events and grow your audience.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/artist/create-event">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Event
          </Link>
        </Button>
      </div>

      <Separator />

      <section>
        <h2 className="text-2xl font-bold mb-4">Past Shows</h2>
        {myEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {format(new Date(event.date), "PPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {eventStats[event.id] ? (
                    <>
                      <p>
                        <span className="font-semibold">Audience:</span>{" "}
                        {eventStats[event.id].audience.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-semibold">Revenue:</span> $
                        {eventStats[event.id].revenue.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Loading stats...</p>
                  )}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No past shows to display.</p>
        )}
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-bold mb-4">Premium Membership</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Free Tier</CardTitle>
                    <CardDescription>Get started on CloudStage</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                     <p className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500"/>Up to 2 events per month</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500"/>Standard Analytics</li>
                        <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500"/>Community Support</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" disabled>Your Current Plan</Button>
                </CardFooter>
            </Card>
          {premiumPlans.map((plan) => (
            <Card key={plan.name} className="flex flex-col border-primary/50 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{plan.name}</CardTitle>
                    <Crown className="h-6 w-6 text-primary" />
                </div>
                <CardDescription>
                  For professionals who want more.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground"></span></p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-primary"/>{feature}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Subscribe</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
