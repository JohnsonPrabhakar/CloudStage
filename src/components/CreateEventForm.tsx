"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { type Event } from "@/lib/types";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  type: z.string().min(1, "Event type is required."),
  language: z.string().min(1, "Language is required."),
  genre: z.string().min(1, "Genre is required."),
  date: z.string().min(1, "Date and time are required."),
  bannerUrl: z.string().url("Must be a valid URL."),
  streamUrl: z.string().url("Must be a valid URL."),
  ticketPrice: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  boost: z.boolean().default(false).optional(),
});

export default function CreateEventForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "Music",
      language: "English",
      genre: "Pop",
      date: "",
      bannerUrl: "https://placehold.co/1280x720.png",
      streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ticketPrice: 10,
      description: "",
      boost: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      title: values.title,
      artist: "Current Artist", // Mocked
      artistId: "artist1", // Mocked
      description: values.description,
      genre: values.genre,
      language: values.language,
      date: new Date(values.date).toISOString(),
      status: "upcoming",
      bannerUrl: values.bannerUrl,
      streamUrl: values.streamUrl,
      ticketPrice: values.ticketPrice,
      isBoosted: values.boost ?? false,
      youtubeUrl: "https://youtube.com", // Mocked
      instagramUrl: "https://instagram.com", // Mocked
    };

    if (typeof window !== "undefined") {
      const pendingEvents = JSON.parse(
        localStorage.getItem("pendingEvents") || "[]"
      );
      pendingEvents.push(newEvent);
      localStorage.setItem("pendingEvents", JSON.stringify(pendingEvents));

      toast({
        title: "Event Submitted!",
        description: "Your event is now pending admin approval.",
      });
      form.reset();
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
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an event type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Comedy">Comedy</SelectItem>
                            <SelectItem value="Workshop">Workshop</SelectItem>
                            <SelectItem value="Talk">Talk</SelectItem>
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
                      <FormLabel>Ticket Price ($)</FormLabel>
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
                    <FormLabel>Event Description</FormLabel>
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
                        Use a high-quality image for your event banner.
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
                        The URL where your event will be streamed.
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
                            <FormLabel>
                            Boost this event ($100)
                            </FormLabel>
                            <FormDescription>
                                Feature your event on the homepage for maximum visibility. A mock payment of $100 will be processed.
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
