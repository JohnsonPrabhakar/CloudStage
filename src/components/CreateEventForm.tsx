"use client";

import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Event, type EventCategory } from "@/lib/types";
import { getEvents } from "@/lib/mock-data";
import { Sparkles } from "lucide-react";
import { generateEventDescription } from "@/ai/flows/generate-event-description";
import { format } from "date-fns";

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
  bannerUrl: z.string().url("Must be a valid URL."),
  streamUrl: z.string().url("Must be a valid URL."),
  ticketPrice: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  boost: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEventForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "Music",
      genre: "Pop",
      language: "English",
      date: "",
      bannerUrl: "https://placehold.co/1280x720.png",
      streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ticketPrice: 10,
      description: "",
      boost: false,
    },
  });

  useEffect(() => {
    const duplicateEventId = searchParams.get('duplicate');
    if (duplicateEventId) {
      const allEvents = getEvents();
      const eventToDuplicate = allEvents.find(e => e.id === duplicateEventId);
      if (eventToDuplicate) {
        form.reset({
          title: `${eventToDuplicate.title} (Copy)`,
          category: eventToDuplicate.category,
          genre: eventToDuplicate.genre,
          language: eventToDuplicate.language,
          date: '', // User should set a new date
          bannerUrl: eventToDuplicate.bannerUrl,
          streamUrl: eventToDuplicate.streamUrl,
          ticketPrice: eventToDuplicate.ticketPrice,
          description: eventToDuplicate.description,
          boost: false
        });
        toast({
            title: "Event Duplicated",
            description: "Event details have been pre-filled. Please set a new date."
        });
      }
    }
  }, [searchParams, form, toast]);

  async function handleGenerateDescription() {
    setIsGenerating(true);
    const { title, genre, category } = form.getValues();

    if (!title || !genre || !category) {
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
        artist: "Current Artist", // Mocked
        genre,
        type: category, // The AI flow expects a 'type' field
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

  function onSubmit(values: FormValues) {
    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      title: values.title,
      artist: "Current Artist", // Mocked
      artistId: "artist1", // Mocked
      description: values.description,
      category: values.category as EventCategory,
      genre: values.genre,
      language: values.language,
      date: new Date(values.date).toISOString(),
      status: new Date(values.date) > new Date() ? "upcoming" : "past",
      moderationStatus: "pending",
      bannerUrl: values.bannerUrl,
      streamUrl: values.streamUrl,
      ticketPrice: values.ticketPrice,
      isBoosted: values.boost ?? false,
      boostAmount: values.boost ? 100 : 0, // Mock boost amount
      youtubeUrl: "https://youtube.com", // Mocked
      instagramUrl: "https://instagram.com", // Mocked
    };

    if (typeof window !== "undefined") {
      const allEvents = getEvents();
      allEvents.push(newEvent);
      localStorage.setItem("events", JSON.stringify(allEvents));

      toast({
        title: "Event Submitted!",
        description: "Your event is now pending admin approval.",
      });
      router.push("/artist/dashboard");
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Create a New Event</CardTitle>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="bannerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://placehold.co/1280x720.png" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use a high-quality image for your banner.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="streamUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/live/..." {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL for your live stream.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
