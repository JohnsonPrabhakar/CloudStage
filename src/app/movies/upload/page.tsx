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
import { addMovie } from "@/lib/firebase-service";
import { ChevronLeft, Film, Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const movieGenres = ['Action', 'Romance', 'Comedy', 'Thriller', 'Drama', 'Sci-Fi', 'Horror'];
const movieLanguages = ['English', 'Hindi', 'Tamil', 'Telugu'];

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  youtubeUrl: z.string().url("Must be a valid URL.").refine(
    (url) => !url || url.includes("youtube.com/embed/"),
    "Please provide a valid YouTube Embed URL (e.g., https://youtube.com/embed/...)."
  ).optional().or(z.literal('')),
  genre: z.string().min(1, "Genre is required"),
  language: z.string().min(1, "Language is required"),
  posterImage: z.instanceof(FileList).optional(),
  movieFile: z.instanceof(FileList).optional(),
}).refine(data => !!data.youtubeUrl || (data.movieFile && data.movieFile.length > 0), {
    message: "You must provide either a YouTube URL or upload a movie file.",
    path: ["youtubeUrl"],
}).refine(data => {
    if (data.movieFile && data.movieFile.length > 0) {
        return data.posterImage && data.posterImage.length > 0;
    }
    return true;
}, {
    message: "A poster image is required when uploading a movie file.",
    path: ["posterImage"],
});


type FormValues = z.infer<typeof formSchema>;

export default function UploadMoviePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [movieFileName, setMovieFileName] = useState<string | null>(null);
  const [youtubeThumbnailPreview, setYoutubeThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@cloudstage.in') {
        setIsAuthenticated(true);
      } else {
        toast({ variant: 'destructive', title: 'Access Denied' });
        router.push("/admin");
      }
    });
    return () => unsubscribe();
  }, [router, toast]);

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
  
  const watchYoutubeUrl = form.watch("youtubeUrl");
  const watchMovieFile = form.watch("movieFile");

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      form.setValue("youtubeUrl", url, { shouldValidate: true });
      const videoId = url.split('embed/')[1]?.split('?')[0];
      if (videoId) {
          setYoutubeThumbnailPreview(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      } else {
          setYoutubeThumbnailPreview(null);
      }
  };

  async function onSubmit(values: FormValues) {
    const posterFile = values.posterImage?.[0];
    const movieFile = values.movieFile?.[0];

    try {
      await addMovie(
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
        }
      );
      toast({
        title: "Movie Added!",
        description: `${values.title} has been successfully added to the library.`,
      });
      router.push("/movies");
    } catch(error) {
      console.error(error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the movie. Please try again.",
        variant: "destructive"
      });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
         <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Verifying admin access...</p>
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
          <CardTitle className="text-3xl flex items-center gap-3">
            <Film /> Upload a New Movie
          </CardTitle>
          <CardDescription>Fill out the details below to add a movie to the platform.</CardDescription>
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
                        <Input placeholder="Enter the movie title" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                 <p className="text-sm font-medium text-center text-muted-foreground">--- OR ---</p>
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
                            setMovieFileName(files?.[0]?.name || null);
                          }}
                          disabled={!!watchYoutubeUrl}
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
                      <FormLabel>YouTube Embed URL</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="https://youtube.com/embed/..." 
                            {...field}
                            onChange={handleYoutubeUrlChange}
                            disabled={!!watchMovieFile && watchMovieFile.length > 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="posterImage"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>
                        Upload Poster
                        {!!watchMovieFile && watchMovieFile.length > 0 && <span className="text-destructive"> *</span>}
                      </FormLabel>
                      
                      {posterPreview && <Image src={posterPreview} alt="Poster preview" width={150} height={225} className="rounded-md border object-cover"/>}
                      
                      {youtubeThumbnailPreview && !posterPreview && !watchMovieFile?.length && (
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
                          disabled={!!watchYoutubeUrl}
                        />
                      </FormControl>
                       <FormDescription>
                        {!!watchMovieFile && watchMovieFile.length > 0 
                          ? "Required when uploading a movie file."
                          : "Optional. If using a YouTube URL, a thumbnail will be auto-generated."
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Uploading..." : "Add Movie"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
