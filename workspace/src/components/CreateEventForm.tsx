
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { addEvent, updateEvent } from "@/lib/firebase-service";
import { type Event } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { CalendarIcon, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { generateEventDescription } from "@/ai/flows/generate-event-description";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const eventCategories = [
  "Music",
  "Stand-up Comedy",
  "Meditation / Yoga",
  "Magic Show",
  "Devotional / Bhajan / Satsang",
  "Workshop",
  "Talk",
] as const;

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  category: z.enum(eventCategories),
  language: z.string().min(2, "Language is required."),
  genre: z.string().min(2, "Genre is required."),
  date: z.date({ required_error: "A date and time is required." }),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  streamUrl: z.string().url("A valid stream URL is required."),
  ticketPrice: z.coerce.number().min(0, "Ticket price cannot be negative."),
  description: z.string().min(20, "Description must be at least 20 characters."),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEventFormProps {
  mode: "create" | "edit";
  initialData?: Event;
}

export default function CreateEventForm({ mode, initialData }: CreateEventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "edit" && initialData
        ? {
            ...initialData,
            date: new Date(initialData.date),
          }
        : {
            title: "",
            language: "",
            genre: "",
            duration: 60,
            streamUrl: "",
            ticketPrice: 0,
            description: "",
          },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push("/artist/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGenerateDescription = async () => {
    const { title, genre, category } = form.getValues();
    if (!title || !genre || !category) {
      toast({
        variant: "destructive",
        title: "Missing Details",
        description: "Please enter a Title, Genre, and Category to generate a description.",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateEventDescription({
        title,
        artist: currentUser?.displayName || "an amazing artist",
        genre,
        type: category,
      });
      form.setValue("description", result.description);
      toast({ title: "Description generated successfully!" });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Generation Failed" });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }

    setIsSubmitting(true);
    try {
      const eventDate = new Date(data.date);
      const endTime = new Date(eventDate.getTime() + data.duration * 60000);

      const eventPayload = {
        ...data,
        artist: currentUser.displayName || "Unknown Artist",
        artistId: currentUser.uid,
        date: eventDate.toISOString(),
        endTime: endTime.toISOString(),
        status: "upcoming" as const,
        moderationStatus: "pending" as const,
        isBoosted: false,
      };
      
      if (mode === 'create') {
        await addEvent(eventPayload);
        toast({ title: "Event Created!", description: "Your event is now pending admin approval." });
      } else if (initialData) {
        await updateEvent(initialData.id, eventPayload);
        toast({ title: "Event Updated!", description: "Your event changes are now pending admin approval." });
      }
      
      router.push("/artist/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Could not save the event. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">{mode === "create" ? "Create New Event" : "Edit Event"}</CardTitle>
          <CardDescription>
            Fill in the details below. All submissions are subject to admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Live Concert Gala" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {eventCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="language" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl><Input placeholder="e.g., Hindi, English" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="genre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <FormControl><Input placeholder="e.g., Rock, Sufi, Pop" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date & Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP p") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={form.control} name="duration" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (in minutes)</FormLabel>
                      <FormControl><Input type="number" min="1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="ticketPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Price (₹)</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
              </div>

               <FormField control={form.control} name="streamUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream URL</FormLabel>
                  <FormControl><Input placeholder="https://youtube.com/live/..." {...field} /></FormControl>
                  <FormDescription>This can be a placeholder. You can set the final YouTube Live URL just before going live.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Tell your audience what the event is about..." className="resize-y min-h-[120px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="button" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate with AI
              </Button>
              
              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {mode === "create" ? "Submit for Approval" : "Update & Resubmit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
