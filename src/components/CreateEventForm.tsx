
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addEvent, getEventById, updateEvent } from "@/lib/firebase-service";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CalendarIcon, ChevronLeft, Drama, Loader2, Mic, Music, Palette } from "lucide-react";
import { type Event, type EventCategory } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { generateEventDescription } from "@/ai/flows/generate-event-description";
import { getYouTubeEmbedUrl } from "@/lib/youtube-utils";


const eventCategories = [
  "Music",
  "Stand-up Comedy",
  "Workshop",
  "Talk",
  "Meditation / Yoga",
  "Magic Show",
  "Devotional / Bhajan / Satsang",
] as const;

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  category: z.enum(eventCategories, { required_error: "Please select a category." }),
  genre: z.string().min(2, "Genre is required (e.g., Rock, Sufi, Pop)."),
  language: z.string().min(2, "Language is required."),
  date: z.date({ required_error: "A date and time for the event is required." }),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  streamUrl: z.string().url("A valid stream URL is required.").refine(
    (url) => getYouTubeEmbedUrl(url) !== null,
    "Please provide a valid YouTube URL (watch, live, or youtu.be link)."
  ),
  ticketPrice: z.coerce.number().min(0, "Ticket price cannot be negative."),
  bannerUrl: z.any().optional(), // For file upload, not a required field
});

type FormValues = z.infer<typeof formSchema>;

type CreateEventFormProps = {
  mode: "create" | "edit";
  initialData?: Event;
};

export default function CreateEventForm({ mode, initialData }: CreateEventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<User | null>(null);
  const [artistName, setArtistName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      genre: "",
      language: "English",
      duration: 60,
      streamUrl: "",
      ticketPrice: 0,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setArtistName(currentUser.displayName || "Artist");
        const duplicateId = searchParams.get('duplicate');
        if (duplicateId && mode === 'create') {
            const eventToDuplicate = await getEventById(duplicateId);
            if (eventToDuplicate) {
                form.reset({
                    ...eventToDuplicate,
                    date: new Date(), // Reset date to now
                });
            }
        }
      } else {
        toast({ variant: 'destructive', title: 'Not Authenticated' });
        router.push('/artist/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast, searchParams, mode, form]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        ...initialData,
        date: new Date(initialData.date),
      });
    }
  }, [mode, initialData, form]);

  const handleGenerateDescription = async () => {
      const { title, genre, category } = form.getValues();
      if (!title || !genre || !category) {
          toast({ variant: 'destructive', title: 'Missing Details', description: 'Please fill in Title, Category, and Genre to generate a description.' });
          return;
      }
      setIsGenerating(true);
      try {
          const result = await generateEventDescription({
              title,
              artist: artistName,
              genre,
              type: category,
          });
          form.setValue('description', result.description);
          toast({ title: 'Description Generated!', description: 'AI has created a description for your event.' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate a description.' });
      } finally {
          setIsGenerating(false);
      }
  };

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const eventPayload: Omit<Event, 'id' | 'createdAt' | 'eventCode' | 'eventCategory'> = {
        artistId: user.uid,
        artist: artistName,
        title: values.title,
        description: values.description,
        category: values.category,
        genre: values.genre,
        language: values.language,
        date: values.date.toISOString(),
        duration: values.duration,
        endTime: new Date(values.date.getTime() + values.duration * 60000).toISOString(),
        status: 'upcoming',
        moderationStatus: 'pending',
        bannerUrl: "", // Will be set by service
        streamUrl: values.streamUrl,
        ticketPrice: values.ticketPrice,
        isBoosted: false,
      };

      if (mode === 'create') {
        await addEvent(eventPayload);
        toast({ title: "Event Submitted!", description: "Your event is now pending admin approval." });
      } else if (initialData) {
        await updateEvent(initialData.id, eventPayload);
        toast({ title: "Event Updated!", description: "Your changes have been submitted for review." });
      }
      
      router.push("/artist/dashboard");
      router.refresh();

    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const streamUrlValue = form.watch("streamUrl");
  const bannerPreview = getYouTubeEmbedUrl(streamUrlValue)
      ? `https://img.youtube.com/vi/${getYouTubeEmbedUrl(streamUrlValue)!.split('/embed/')[1]}/hqdefault.jpg`
      : "https://placehold.co/600x400.png";

  if (loading) {
      return <div>Loading form...</div>
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4" disabled={isSubmitting}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">{mode === 'create' ? 'Create a New Event' : 'Edit Event'}</CardTitle>
          <CardDescription>Fill out the details below. All events are reviewed by an admin before going live.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Event Title</FormLabel><FormControl><Input placeholder="e.g., Live Acoustic Session" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="streamUrl" render={({ field }) => (
                  <FormItem><FormLabel>YouTube Stream URL</FormLabel><FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              {bannerPreview && (
                  <FormItem>
                      <FormLabel>Banner Preview</FormLabel>
                      <div className="w-full aspect-video relative rounded-md overflow-hidden bg-muted">
                        <Image src={bannerPreview} alt="Banner Preview" fill className="object-cover" data-ai-hint="event banner" />
                      </div>
                      <FormDescription>The banner is automatically generated from your YouTube URL thumbnail.</FormDescription>
                  </FormItem>
              )}

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Event Description</FormLabel>
                    <Button type="button" size="sm" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Palette className="mr-2 h-4 w-4" />}
                        Generate with AI
                    </Button>
                  </div>
                  <FormControl><Textarea placeholder="Tell everyone what your event is about..." className="resize-y min-h-[100px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>{eventCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                    </Select>
                  <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="genre" render={({ field }) => (
                  <FormItem><FormLabel>Genre</FormLabel><FormControl><Input placeholder="e.g., Rock, Pop, Sufi" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP p") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                    </Popover>
                  <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem><FormLabel>Duration (in minutes)</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ticketPrice" render={({ field }) => (
                  <FormItem><FormLabel>Ticket Price (₹)</FormLabel><FormControl><Input type="number" min="0" step="10" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : (mode === 'create' ? "Submit for Approval" : "Update Event")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

