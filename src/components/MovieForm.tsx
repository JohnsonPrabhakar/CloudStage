
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
import { Progress } from "@/components/ui/progress";
import { type Movie } from "@/lib/types";

const movieGenres = ['Action', 'Romance', 'Comedy', 'Thriller', 'Drama', 'Sci-Fi', 'Horror'];
const movieLanguages = ['English', 'Hindi', 'Tamil', 'Telugu'];

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  youtubeUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  genre: z.string().min(1, "Genre is required"),
  language: z.string().min(1, "Language is required"),
  posterImage: z.any().optional(),
  movieFile: z.any().optional(),
}).refine(data => !!data.youtubeUrl || (data.movieFile && data.movieFile.length > 0) || (data.posterImage && data.posterImage.length > 0), {
    message: "You must provide either a YouTube URL or upload a movie file.",
    path: ["youtubeUrl"],
});

type FormValues = z.infer<typeof formSchema>;

type MovieFormProps = {
    mode: 'create' | 'edit';
    initialData?: Movie;
}

export function MovieForm({ mode, initialData }: MovieFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [posterPreview, setPosterPreview] = useState<string | null>(initialData?.posterUrl || null);
  const [youtubeThumbnailPreview, setYoutubeThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeUrl: "",
      genre: "Action",
      language: "English",
      posterImage: undefined,
      movieFile: undefined,
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
      if (initialData.posterUrl) {
        setPosterPreview(initialData.posterUrl);
      }
    }
  }, [mode, initialData, form]);
  
  const watchYoutubeUrl = form.watch("youtubeUrl");
  const watchMovieFile = form.watch("movieFile");

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
    const posterFile = values.posterImage?.[0];
    const movieFile = values.movieFile?.[0];

    if (movieFile) {
      setUploadProgress(0);
    }
    
    const action = mode === 'create' ? addMovie : (data: any, uploads: any, progress: any) => updateMovie(initialData!.id, data, uploads, progress);
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
          youtubeUrl: values.youtubeUrl || undefined,
          movieFile: movieFile,
          posterFile: posterFile,
          existingPosterUrl: initialData?.posterUrl,
          existingVideoUrl: initialData?.videoUrl,
        },
        (progress) => {
            setUploadProgress(progress);
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
    } finally {
        setUploadProgress(null);
    }
  }

  const isSubmitting = form.formState.isSubmitting || uploadProgress !== null;
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

               <div className="space-y-2">
                 <p className="text-sm font-medium text-center text-muted-foreground">--- Video Source ---</p>
               </div>
               
               <FormField
                  control={form.control}
                  name="movieFile"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Upload Movie File</FormLabel>
                      <FormControl>
                         <Input 
                          type="file" 
                          accept="video/mp4,video/webm,video/mov"
                           {...rest}
                          onChange={(e) => {
                            const files = e.target.files;
                            onChange(files);
                          }}
                          disabled={!!watchYoutubeUrl || isSubmitting}
                        />
                      </FormControl>
                       <FormDescription>
                        Provide this OR a YouTube URL. Local file upload takes precedence.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            disabled={!!(watchMovieFile && watchMovieFile.length > 0) || isSubmitting}
                        />
                      </FormControl>
                       <FormDescription>
                        The URL will be automatically converted to the required format.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                 <p className="text-sm font-medium text-center text-muted-foreground">--- Poster Image ---</p>
               </div>

                <FormField
                  control={form.control}
                  name="posterImage"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>
                        Upload Poster
                        {!!watchMovieFile && watchMovieFile.length > 0 && <span className="text-destructive"> *</span>}
                      </FormLabel>
                      
                      {posterPreview && <Image src={posterPreview} alt="Poster preview" width={150} height={225} className="rounded-md border object-cover" data-ai-hint="movie poster"/>}
                      
                      {youtubeThumbnailPreview && !posterPreview && !(watchMovieFile && watchMovieFile.length > 0) && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">YouTube Thumbnail (auto-generated):</p>
                            <Image src={youtubeThumbnailPreview} alt="YouTube thumbnail preview" width={150} height={90} className="rounded-md border object-cover" data-ai-hint="movie thumbnail"/>
                          </div>
                      )}
                      
                      <FormControl>
                         <Input 
                          type="file" 
                          accept="image/jpeg, image/png, image/webp"
                           {...rest}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              onChange(files);
                              setPosterPreview(URL.createObjectURL(files[0]));
                            } else {
                              onChange(undefined);
                              setPosterPreview(null);
                            }
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                       <FormDescription>
                        {!!watchMovieFile && watchMovieFile.length > 0 || (mode === 'edit' && !watchYoutubeUrl)
                          ? "Required when uploading a movie file or if no YouTube URL is provided."
                          : "Optional. If using a YouTube URL, a thumbnail will be auto-generated."
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-4">
                    <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {uploadProgress !== null ? "Uploading..." : "Processing..."}
                            </>
                        ) : buttonText}
                    </Button>
                    {uploadProgress !== null && (
                        <div className="space-y-1">
                            <Progress value={uploadProgress} />
                            <p className="text-sm text-muted-foreground text-center">
                                {Math.round(uploadProgress)}% complete
                            </p>
                        </div>
                    )}
                </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
