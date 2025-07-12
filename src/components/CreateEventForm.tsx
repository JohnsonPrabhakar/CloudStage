
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addEvent, updateEvent, getEventById, getArtistProfile } from '@/lib/firebase-service';
import { type Event, type EventCategory } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Calendar as CalendarIcon, Loader2, ChevronLeft, Sparkles, BrainCircuit } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { getYouTubeVideoId } from '@/lib/youtube-utils';
import { generateEventDescription } from '@/ai/flows/generate-event-description';

const eventCategories = [
  'Music',
  'Devotional / Bhajan / Satsang',
  'Magic Show',
  'Meditation / Yoga',
  'Stand-up Comedy',
  'Workshop',
  'Talk',
] as const;

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  category: z.enum(eventCategories, { required_error: 'Category is required.' }),
  genre: z.string().min(2, 'Genre is required.'),
  language: z.string().min(2, 'Language is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  streamUrl: z.string().url('Please enter a valid YouTube URL.'),
  ticketPrice: z.coerce.number().min(0, 'Ticket price cannot be negative.'),
});

type FormValues = z.infer<typeof formSchema>;

type CreateEventFormProps = {
  mode: 'create' | 'edit';
  initialData?: Event;
};

export default function CreateEventForm({ mode, initialData }: CreateEventFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [artistName, setArtistName] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category,
      genre: initialData?.genre || '',
      language: initialData?.language || '',
      date: initialData ? new Date(initialData.date) : new Date(),
      duration: initialData?.duration || 60,
      streamUrl: initialData?.streamUrl || '',
      ticketPrice: initialData?.ticketPrice || 0,
    },
  });

  const streamUrlValue = useWatch({ control: form.control, name: 'streamUrl' });
  const videoId = getYouTubeVideoId(streamUrlValue);

  const bannerPreview = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : 'https://placehold.co/600x400.png';

  useEffect(() => {
    const duplicateEventId = searchParams.get('duplicate');
    if (mode === 'create' && duplicateEventId) {
      const fetchAndSetEventData = async () => {
        const eventToDuplicate = await getEventById(duplicateEventId);
        if (eventToDuplicate) {
          form.reset({
            ...eventToDuplicate,
            date: new Date(), // Reset date to today
          });
          toast({ title: 'Event Duplicated', description: 'Event details have been pre-filled.' });
        }
      };
      fetchAndSetEventData();
    }
  }, [mode, searchParams, form, toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const artistProfile = await getArtistProfile(currentUser.uid);
        if (artistProfile) {
          setArtistName(artistProfile.name);
        } else {
            toast({ variant: 'destructive', title: 'Profile Incomplete', description: 'Please complete your artist profile before creating an event.' });
            router.push('/artist/register');
        }
      } else {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in.' });
        router.push('/artist/login');
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    const { title, genre, category } = form.getValues();
    try {
      if (!title || !artistName) {
        toast({
          variant: 'destructive',
          title: 'Missing Info',
          description: 'Please provide an Event Title before generating.',
        });
        return;
      }
      const result = await generateEventDescription({
        title,
        artist: artistName,
        genre: genre || 'Not specified',
        type: category || 'General',
      });
      if (result.description) {
        form.setValue('description', result.description);
        toast({ title: 'Description Generated!', description: 'AI has written an event description for you.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  async function onSubmit(values: FormValues) {
    if (!user || !artistName) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or artist information is missing.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const eventDate = new Date(values.date);
      const endTime = new Date(eventDate.getTime() + values.duration * 60000);

      const eventPayload = {
        ...values,
        date: eventDate.toISOString(),
        endTime: endTime.toISOString(),
        artist: artistName,
        artistId: user.uid,
        moderationStatus: 'pending' as const,
        status: 'upcoming' as const,
        isBoosted: initialData?.isBoosted || false,
      };

      if (mode === 'create') {
        await addEvent(eventPayload);
        toast({ title: 'Event Submitted!', description: 'Your event is pending admin approval.' });
      } else if (initialData) {
        await updateEvent(initialData.id, eventPayload);
        toast({ title: 'Event Updated!', description: 'Your event changes are pending admin approval.' });
      }

      router.push('/artist/dashboard');
      router.refresh();
    } catch (error: any) {
      console.error('Event submission failed:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ChevronLeft /> Back to Dashboard
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">{mode === 'create' ? 'Create New Event' : 'Edit Event'}</CardTitle>
          <CardDescription>
            Fill out the details below. All events are subject to admin approval before going live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="w-full aspect-video relative rounded-lg overflow-hidden border">
                  <Image
                    src={bannerPreview}
                    alt="YouTube Thumbnail Preview"
                    layout="fill"
                    objectFit="cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      target.onerror = null; // prevent infinite loop
                    }}
                    data-ai-hint="youtube thumbnail"
                  />
                </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Live Concert by The Rockers" {...field} />
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
                    <FormLabel>YouTube Stream URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormDescription>The video thumbnail will be used as the event banner.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell your audience what the event is about..."
                            className="resize-y min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                  Generate with AI
                </Button>
              </FormItem>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
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
                      <FormLabel>Genre / Sub-category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Rock, Sufi, Pop" {...field} />
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
                      <FormLabel>Primary Language</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hindi, English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date & Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                            >
                              {field.value ? format(field.value, 'PPP p') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (in minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
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
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Set to 0 for a free event.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {mode === 'create' ? 'Submit for Approval' : 'Update & Resubmit'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
