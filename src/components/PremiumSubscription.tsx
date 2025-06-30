"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Crown, ChevronLeft } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getArtistProfile, updateArtistToPremium } from "@/lib/firebase-service";
import { Skeleton } from "./ui/skeleton";

export default function PremiumSubscription() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profile = await getArtistProfile(user.uid);
            if (profile?.isApproved) {
                setArtistId(user.uid);
            } else {
                 router.push(profile ? '/artist/pending' : '/artist/login');
            }
        } else {
             router.push('/artist/login');
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);


  const handleSubscribe = (planName: string, price: number) => {
    if (!artistId) return;
    setLoading(planName);

    setTimeout(async () => {
      await updateArtistToPremium(artistId);

      toast({
        title: "Subscription Successful!",
        description: `You've subscribed to the ${planName} plan for ₹${price}/month.`,
      });

      router.push("/artist/dashboard");
      setLoading(null);
    }, 1500);
  };

  const plans = [
    {
      name: "Pro Artist",
      price: 99,
      features: [
        "Basic Boost Perks",
        "Priority Event Listing",
        "Advanced Analytics",
        "Email Support",
      ],
    },
    {
      name: "Legend",
      price: 149,
      features: [
        "All Pro features",
        "Top Listing Placement",
        "1 Free Boost Credit per Month",
        "Dedicated 24/7 Support",
      ],
    },
  ];
  
  if (authLoading) {
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 animate-pulse">
            <Skeleton className="h-8 w-32 mb-4"/>
            <div className="text-center space-y-2">
                <Skeleton className="h-10 w-3/4 mx-auto"/>
                <Skeleton className="h-5 w-1/2 mx-auto"/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
             </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
       <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="text-center">
        <h1 className="text-4xl font-bold">Choose Your Premium Plan</h1>
        <p className="text-muted-foreground mt-2">
          Unlock powerful tools to grow your audience and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="flex flex-col border-primary/50 shadow-lg"
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">
                  ₹{plan.price}
                </span>
                /month
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(plan.name, plan.price)}
                disabled={loading !== null}
              >
                {loading === plan.name ? "Processing..." : "Subscribe Now"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
