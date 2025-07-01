
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addMovie, updateMovie } from "@/lib/firebase-service";
import { ChevronLeft, Film, Loader2 } from "lucide-react";
import { type Movie } from "@/lib/types";

const movieGenres = ['Action', 'Romance', 'Comedy', 'Thriller', 'Drama', 'Sci-Fi', 'Horror'];
const movieLanguages = ['English', 'Hindi', 'Tamil', 'Telugu'];

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  youtubeUrl: z.string().url("A valid YouTube URL is required."),
  genre: z.string().min(1, "Genre is required"),
  language: z.string().min(1, "Language is required"),
});

type FormValues = z.infer<typeof formSchema>;

type MovieFormProps = {
    mode: 'create' | 'edit';
    initialData?: Movie;
}

export function MovieForm({ mode, initialData }: MovieFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [youtubeThumbnailPreview, setYoutubeThumbnailPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeUrl: "",
      genre: "Action",
      language: "English",
    },
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description,
        genre: initialData.genre.charAt(0).toUpperCase() + initialData.genre.slice(1),
        language: initialData.language.charAt(0).toUpperCase() + initialData.language.slice(1),
        youtubeUrl: initialData.videoUrl.includes('youtube.com') ? initialData.videoUrl : '',
      });
      if(initialData.posterUrl.includes('img.youtube.com')) {
          setYoutubeThumbnailPreview(initialData.posterUrl);
      }
    }
  }, [mode, initialData, form]);
  
  const convertToEmbedUrl = (url: string): string => {
    if (!url) return "";
    let videoId = null;

    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split('&')[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split('?')[0];
    } else if (url.includes("youtube.com/embed/")) {
      return url; // Already correct
    } else if (url.includes("youtube.com/live/")) {
      videoId = url.split("live/")[1]?.split('?')[0];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url; // Return original if no standard format is found
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const originalUrl = e.target.value;
      const finalUrl = convertToEmbedUrl(originalUrl);
      
      form.setValue("youtubeUrl", finalUrl, { shouldValidate: true, shouldDirty: true });

      const videoId = finalUrl.split('embed/')[1]?.split('?')[0] || finalUrl.split('live/')[1]?.split('?')[0];
      if (videoId) {
          setYoutubeThumbnailPreview(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      } else {
          setYoutubeThumbnailPreview(null);
      }
  };

  async function onSubmit(values: FormValues) {
    const action = mode === 'create' ? addMovie : (data: any, uploads: any) => updateMovie(initialData!.id, data, uploads);
    const successTitle = mode === 'create' ? "Movie Added!" : "Movie Updated!";
    const successDescription = `${values.title} has been successfully ${mode === 'create' ? 'added' : 'updated'}.`;

    try {
      await action(
        { // movieData
          title: values.title,
          description: values.description,
          genre: values.genre,
          language: values.language,
        },
        { // uploadDetails
          youtubeUrl: values.youtubeUrl,
        }
      );
      toast({
        title: successTitle,
        description: successDescription,
      });
      
      router.push("/admin/dashboard");
      router.refresh(); // Refresh to ensure the admin list is updated.

    } catch(error) {
      console.error(error);
      toast({
        title: "Action Failed",
        description: "There was an error saving the movie. Please try again.",
        variant: "destructive"
      });
    }
  }

  const isSubmitting = form.formState.isSubmitting;
  const pageTitle = mode === 'create' ? "Upload a New Movie" : "Edit Movie";
  const pageDescription = mode === 'create' ? "Fill out the details below to add a movie to the platform." : `Editing details for "${initialData?.title}".`;
  const buttonText = mode === 'create' ? "Add Movie" : "Save Changes";


  return (
    <div className="container mx-auto p-4 md:p-8">
       <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
        disabled={isSubmitting}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Film /> {pageTitle}
          </CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Movie Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the movie title" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief summary of the movie..."
                          className="resize-y min-h-[100px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {movieGenres.map(cat => (
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {movieLanguages.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               
               <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="Paste any YouTube URL (e.g., watch?v=...)" 
                            {...field}
                            onChange={handleYoutubeUrlChange}
                            disabled={isSubmitting}
                        />
                      </FormControl>
                       <FormDescription>
                        A valid YouTube URL is required. The video poster will be generated from this.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {youtubeThumbnailPreview && (
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Poster Preview (auto-generated):</p>
                        <Image src={youtubeThumbnailPreview} alt="YouTube thumbnail preview" width={150} height={90} className="rounded-md border object-cover" data-ai-hint="movie thumbnail"/>
                    </div>
                )}
                
                <div className="flex flex-col gap-4">
                    <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : buttonText}
                    </Button>
                </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
