
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Artist } from "@/lib/types";
import { BadgeCheck, ChevronLeft, Loader2, ShieldAlert } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getArtistProfile, submitVerificationRequest } from "@/lib/firebase-service";

const formSchema = z.object({
  youtubeLinks: z.string().min(1, "Please provide at least one YouTube link."),
  instagramLinks: z.string().optional(),
  sampleVideo: z.any().optional(),
  messageToAdmin: z.string().min(20, "Please provide a message of at least 20 characters."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ArtistVerificationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeLinks: "",
      instagramLinks: "",
      messageToAdmin: "",
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const profile = await getArtistProfile(currentUser.uid);
            if (profile?.isApproved) {
                setArtist(profile);
                if(profile.accessLevel === 'verified') {
                    toast({ title: "Already Verified!", description: "You are already a verified artist." });
                    router.push('/artist/dashboard');
                    return;
                }
                if (profile.verificationRequest?.status === 'pending') {
                    setIsRequestPending(true);
                }
            } else {
                router.push(profile ? '/artist/pending' : '/artist/login');
            }
        } else {
            router.push('/artist/login');
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  async function onSubmit(values: FormValues) {
    if (!user || !artist) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not identify logged in artist.' });
        return;
    }
    if (isRequestPending) {
        toast({ variant: 'destructive', title: 'Request Pending', description: 'You already have a verification request under review.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const requestData = {
          youtubeLinks: values.youtubeLinks.split('\n').filter(link => link.trim() !== ''),
          instagramLinks: values.instagramLinks?.split('\n').filter(link => link.trim() !== '') || [],
          messageToAdmin: values.messageToAdmin,
        };
        const sampleVideoFile = values.sampleVideo?.[0];

        await submitVerificationRequest(user.uid, requestData, sampleVideoFile);
        
        toast({
            title: "Request Submitted!",
            description: "Your verification request is now under review. We'll notify you of the outcome.",
        });
        router.push("/artist/dashboard");
    } catch(error) {
         toast({
            title: "Submission Failed",
            description: "There was an error submitting your request. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <p>Loading verification status...</p>
        </div>
    );
  }

  if (isRequestPending) {
      return (
        <div className="container mx-auto p-4 md:p-8">
            <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                        <ShieldAlert className="h-8 w-8 text-primary"/>
                        Verification Request Pending
                    </CardTitle>
                    <CardDescription>
                       Your request is already under review.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                       Our team is reviewing your submission. You will be notified via email about the decision. Thank you for your patience.
                    </p>
                </CardContent>
                <CardFooter>
                     <Button variant="outline" className="w-full" onClick={() => router.push('/artist/dashboard')}>
                        <ChevronLeft className="mr-2 h-4 w-4"/>
                        Back to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
      );
  }


  return (
    <div className="container mx-auto p-4 md:p-8">
       <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3"><BadgeCheck/> Apply for Verified Badge</CardTitle>
          <CardDescription>A verified badge helps build trust with your audience. Provide links to your existing work so our team can review your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="youtubeLinks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Links</FormLabel>
                      <FormControl>
                        <Textarea
                            placeholder="https://youtube.com/watch?v=..."
                            className="resize-y min-h-[100px]"
                            {...field}
                        />
                      </FormControl>
                      <FormDescription>Provide links to your performances or channel. One link per line.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagramLinks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram Links (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                            placeholder="https://instagram.com/yourprofile"
                            className="resize-y min-h-[100px]"
                            {...field}
                        />
                      </FormControl>
                      <FormDescription>Provide links to your Instagram profile or relevant posts. One link per line.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sampleVideo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Video (Optional)</FormLabel>
                       <FormControl>
                        <Input 
                          type="file" 
                          accept="video/mp4, video/quicktime"
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormDescription>Upload a short sample of your work (max 50MB).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="messageToAdmin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message to Admin</FormLabel>
                      <FormControl>
                        <Textarea
                            placeholder="Tell us why you should be verified..."
                            className="resize-y min-h-[100px]"
                            {...field}
                        />
                      </FormControl>
                      <FormDescription>Briefly explain your background or any other information you think is relevant for the review process.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
