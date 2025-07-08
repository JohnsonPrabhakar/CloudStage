
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
import { CheckCircle, Crown, ChevronLeft, Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getArtistProfile } from "@/lib/firebase-service";
import { Skeleton } from "./ui/skeleton";
import { createCashfreeOrder } from "@/lib/actions";
import Script from "next/script";

declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function PremiumSubscription() {
  const router = useRouter();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [artist, setArtist] = useState<{id: string, email: string | null, name: string} | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profile = await getArtistProfile(user.uid);
            if (profile?.isApproved) {
                setArtist({ id: user.uid, email: user.email, name: profile.name });
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


  const handleSubscribe = async (planName: string, price: number) => {
    if (!artist || !artist.email || !artist.name) return;
    setProcessingPlan(planName);

    try {
        const orderResponse = await createCashfreeOrder({
            amount: price,
            receiptId: `PREMIUM_${planName.toUpperCase()}_${Date.now()}`,
            customer_name: artist.name,
            customer_email: artist.email,
            customer_phone: '9999999999', // Placeholder phone number
            userId: artist.id,
            planName: planName,
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
              description: `Your subscription is being processed. You will be redirected shortly.`,
            });
            // The webhook will handle the database update.
            // Redirect after a short delay to allow webhook processing.
            setTimeout(() => {
              router.push("/artist/dashboard");
            }, 3000);
          },
          onFailure: (data: any) => {
            console.error("Cashfree payment failure (client-side):", data);
            toast({
                title: 'Payment Failed',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
            setProcessingPlan(null);
          },
          onClose: () => {
             console.log("Payment form closed by user.");
             setProcessingPlan(null);
          }
        });

    } catch (error: any) {
        toast({
            title: "Subscription Failed",
            description: error.message || "There was an error initiating the payment. Please try again.",
            variant: "destructive",
        });
        setProcessingPlan(null);
    }
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
    <>
    <Script
        id="cashfree-checkout-js"
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
    />
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
                disabled={processingPlan !== null}
              >
                {processingPlan === plan.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Processing...
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
    </>
  );
}
