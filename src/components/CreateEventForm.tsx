
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type EventCategory, type Artist } from "@/lib/types";
import { Sparkles, ChevronLeft, Info, Loader2 } from "lucide-react";
import { generateEventDescription } from "@/ai/flows/generate-event-description";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { getArtistProfile, getEventById, getYouTubeEmbedUrl, addEvent } from "@/lib/firebase-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Skeleton } from "./ui/skeleton";

const eventCategories: EventCategory[] = [
  "Music",
  "Devotional / Bhajan / Satsang",
  "Magic Show",
  "Meditation / Yoga",
  "Stand-up Comedy",
  "Workshop",
  "Talk"
];

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  category: z.string().min(1, "Event category is required."),
  genre: z.string().min(1, "Genre is required."),
  language: z.string().min(1, "Language is required."),
  date: z.string().min(1, "Date and time are required."),
  streamUrl: z.string().url("Must be a valid URL.").refine(
    (url) => getYouTubeEmbedUrl(url) !== null,
    "Please provide a valid YouTube URL (e.g., watch, live, or youtu.be link)."
  ),
  ticketPrice: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  boost: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEventForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "Music",
      genre: "",
      language: "",
      date: "",
      streamUrl: "",
      ticketPrice: 0,
      description: "",
      boost: false,
    },
  });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profile = await getArtistProfile(user.uid);
            if (profile?.isApproved) {
                setArtist(profile);
            } else if (profile) {
                router.push('/artist/pending');
            } else {
                router.push('/artist/login');
            }
        } else {
            router.push('/artist/login');
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);


  useEffect(() => {
    const duplicateEventId = searchParams.get('duplicate');
    if (duplicateEventId) {
      const fetchAndSetEvent = async () => {
        const eventToDuplicate = await getEventById(duplicateEventId);
        if (eventToDuplicate) {
          form.reset({
            title: `${eventToDuplicate.title} (Copy)`,
            category: eventToDuplicate.category,
            genre: eventToDuplicate.genre,
            language: eventToDuplicate.language,
            date: '', // User must set a new date
            streamUrl: eventToDuplicate.streamUrl.includes('youtube.com/embed') ? eventToDuplicate.streamUrl : '',
            ticketPrice: eventToDuplicate.ticketPrice,
            description: eventToDuplicate.description,
            boost: false,
          });
          setBannerPreview(eventToDuplicate.bannerUrl); // Show old banner as preview
          toast({
            title: "Event Duplicated",
            description: "Event details have been pre-filled. Please set a new date and time.",
          });
        }
      }
      fetchAndSetEvent();
    }
  }, [searchParams, form, toast]);
  
  const handleStreamUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalUrl = e.target.value;
    const embedUrl = getYouTubeEmbedUrl(originalUrl);
    form.setValue("streamUrl", embedUrl || originalUrl, { shouldValidate: true, shouldDirty: true });
  };
  
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ variant: 'destructive', title: 'File too large', description: 'Banner image must be less than 5MB.' });
            return;
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload a JPG or PNG image.' });
            return;
        }
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    }
  }

  async function handleGenerateDescription() {
    setIsGenerating(true);
    const { title, genre, category } = form.getValues();

    if (!title || !genre || !category || !artist) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out Title, Category, and Genre.",
      });
      setIsGenerating(false);
      return;
    }

    try {
      const result = await generateEventDescription({
        title,
        artist: artist.name,
        genre,
        type: category,
      });
      if (result.description) {
        form.setValue("description", result.description, { shouldValidate: true });
        toast({
          title: "Description Generated!",
          description: "The AI has written an event description for you.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate a description. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSubmit(values: FormValues) {
    if (!artist) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not identify logged in artist.' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const eventData = {
        title: values.title,
        artist: artist.name,
        artistId: artist.id,
        description: values.description,
        category: values.category as EventCategory,
        genre: values.genre,
        language: values.language,
        date: new Date(values.date).toISOString(),
        status: new Date(values.date) > new Date() ? 'upcoming' : 'past',
        streamUrl: values.streamUrl,
        ticketPrice: values.ticketPrice,
        isBoosted: values.boost ?? false,
        boostAmount: values.boost ? 100 : 0,
        moderationStatus: 'pending' as const,
      };

      const existingBannerUrl = searchParams.get('duplicate') ? bannerPreview : null;
      const { bannerUploaded } = await addEvent(eventData, bannerFile, existingBannerUrl);

      if (bannerUploaded) {
         toast({
          title: "Event Submitted!",
          description: "Your event is now pending admin approval. Redirecting...",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Event Created with an Error",
          description: "Your event was submitted, but the banner upload failed. You can edit the event later to re-upload the banner.",
          duration: 8000,
        });
      }

      router.push("/artist/dashboard");

    } catch (error: any) {
      console.error("Event Submission Error:", error);
      toast({
        title: "Submission Failed",
        description: `A critical error occurred: ${error.message}. Please check your internet connection and try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  if (loading) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-32" />
                </CardContent>
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
          <CardTitle className="text-3xl">Create a New Event</CardTitle>
          <CardDescription>Fill out the details below to put your event on stage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Concert" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date and Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Rock, Pop, Stand-up" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., English, Spanish" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ticketPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormItem>
                  <FormLabel>Upload Event Banner (JPG/PNG, Max 5MB)</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/jpeg, image/png"
                      onChange={handleBannerChange}
                    />
                  </FormControl>
                  <FormMessage />
                  {bannerPreview && (
                    <div className="mt-4">
                        <Image src={bannerPreview} alt="Banner preview" width={200} height={100} className="rounded-md border object-cover" />
                    </div>
                  )}
                </FormItem>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Event Description</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateDescription}
                        disabled={isGenerating}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isGenerating ? "Generating..." : "Generate with AI"}
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your event..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                  control={form.control}
                  name="streamUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        YouTube Stream URL
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Paste any YouTube URL (live, watch, or embed).<br/> It will be converted automatically.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Paste any YouTube URL..." 
                          {...field}
                          onChange={handleStreamUrlChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="boost"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Boost this event (₹100)</FormLabel>
                          <FormDescription>
                            Feature your event on the homepage. A mock
                            payment of ₹100 will be processed.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting || !artist}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Approval"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
