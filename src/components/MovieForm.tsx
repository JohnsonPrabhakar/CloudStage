
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";


const movieGenres = ['Action', 'Romance', 'Comedy', 'Thriller', 'Drama', 'Sci-Fi', 'Horror'];
const movieLanguages = ['English', 'Hindi', 'Tamil', 'Telugu'];

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  genre: z.string().min(1, "Genre is required"),
  language: z.string().min(1, "Language is required"),
  youtubeUrl: z.string().optional(),
  movieFile: z.any().optional(),
  posterFile: z.any().optional(),
});


type FormValues = z.infer<typeof formSchema>;

type MovieFormProps = {
    mode: 'create' | 'edit';
    initialData?: Movie;
}

export function MovieForm({ mode, initialData }: MovieFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const [uploadSource, setUploadSource] = useState<'local' | 'youtube'>('local');
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      genre: "Action",
      language: "English",
      youtubeUrl: "",
    },
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const isYoutube = initialData.videoUrl.includes('youtube.com');
      setUploadSource(isYoutube ? 'youtube' : 'local');
      
      form.reset({
        title: initialData.title,
        description: initialData.description,
        genre: initialData.genre.charAt(0).toUpperCase() + initialData.genre.slice(1),
        language: initialData.language.charAt(0).toUpperCase() + initialData.language.slice(1),
        youtubeUrl: isYoutube ? initialData.videoUrl : "",
      });
      
      setPosterPreview(initialData.posterUrl);
    }
  }, [mode, initialData, form]);

  const isValidYoutubeUrl = (url: string) => {
    return url.includes('youtube.com/') || url.includes('youtu.be/');
  }
  
  async function onSubmit(values: FormValues) {
    if (form.formState.isSubmitting) return;

    // Manual Validation based on uploadSource
    if (uploadSource === 'youtube') {
      if (!values.youtubeUrl || !isValidYoutubeUrl(values.youtubeUrl)) {
        toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please provide a valid YouTube watch or share URL.' });
        return;
      }
    } else { // 'local'
      if (mode === 'create' && (!values.movieFile?.[0] || !values.posterFile?.[0])) {
        toast({ variant: 'destructive', title: 'Missing Files', description: 'For local uploads, both a movie file and a poster image are required.' });
        return;
      }
    }
    
    form.clearErrors();

    try {
      const movieFile = values.movieFile?.[0];
      const posterFile = values.posterFile?.[0];

      const action = mode === 'create' 
          ? addMovie
          : (data: any) => updateMovie(initialData!.id, data);
          
      const successTitle = mode === 'create' ? "Movie Added!" : "Movie Updated!";
      
      await action({
          movieData: {
            title: values.title,
            description: values.description,
            genre: values.genre,
            language: values.language,
          },
          files: { movieFile, posterFile },
          youtubeUrl: uploadSource === 'youtube' ? values.youtubeUrl : undefined,
      });
      
      toast({
          title: successTitle,
          description: `${values.title} has been successfully ${mode === 'create' ? 'added' : 'updated'}.`,
      });
      
      router.push("/admin/dashboard?tab=manage-movies");
      router.refresh();

    } catch(error: any) {
        console.error(error);
        toast({
            title: "Action Failed",
            description: error.message || "There was an error saving the movie. Please try again.",
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
                          {movieLanguages.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel>Upload Source</FormLabel>
                <RadioGroup
                    value={uploadSource}
                    onValueChange={(value) => setUploadSource(value as 'local' | 'youtube')}
                    className="flex gap-4"
                    disabled={isSubmitting}
                >
                    <FormItem className="flex items-center space-x-2">
                        <FormControl>
                            <RadioGroupItem value="local" id="local"/>
                        </FormControl>
                        <Label htmlFor="local">Upload from Computer</Label>
                    </FormItem>
                     <FormItem className="flex items-center space-x-2">
                        <FormControl>
                            <RadioGroupItem value="youtube" id="youtube"/>
                        </FormControl>
                        <Label htmlFor="youtube">Use YouTube Link</Label>
                    </FormItem>
                </RadioGroup>
              </FormItem>
              
              {uploadSource === 'youtube' ? (
                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          {...field} 
                          value={field.value ?? ''}
                          disabled={isSubmitting} 
                        />
                      </FormControl>
                      <FormDescription>The movie poster will be generated automatically from the thumbnail.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                      control={form.control}
                      name="movieFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Movie File</FormLabel>
                          <FormControl>
                            <Input type="file" accept="video/mp4" onChange={(e) => field.onChange(e.target.files)} disabled={isSubmitting} />
                          </FormControl>
                          <FormDescription>{mode === 'edit' ? "Upload new file to replace existing one." : "Upload the video file (MP4 format)."}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="posterFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poster Image</FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/jpeg, image/png"
                              onChange={(e) => {
                                field.onChange(e.target.files);
                                if (e.target.files && e.target.files[0]) {
                                  setPosterPreview(URL.createObjectURL(e.target.files[0]));
                                }
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormDescription>{mode === 'edit' ? "Upload new image to replace existing one." : "Upload a poster image (JPG, PNG)."}</FormDescription>
                          {posterPreview && (
                              <div className="mt-4">
                                  <Image src={posterPreview} alt="Poster preview" width={150} height={225} className="rounded-md border object-cover" data-ai-hint="movie poster"/>
                              </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
              )}
                
                <div className="flex flex-col gap-4 pt-4">
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
