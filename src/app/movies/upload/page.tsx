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
import { type MovieGenre, type MovieLanguage } from "@/lib/types";
import { addMovie } from "@/lib/mock-movies";
import { ChevronLeft, Film } from "lucide-react";

const movieGenres: MovieGenre[] = ['Action', 'Romance', 'Comedy', 'Thriller', 'Drama', 'Sci-Fi', 'Horror'];
const movieLanguages: MovieLanguage[] = ['English', 'Hindi', 'Tamil', 'Telugu'];

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  youtubeUrl: z.string().url("Must be a valid URL.").refine(
    (url) => url.includes("youtube.com/embed/"),
    "Please provide a valid YouTube Embed URL (e.g., https://youtube.com/embed/...)."
  ),
  genre: z.enum(movieGenres),
  language: z.enum(movieLanguages),
  posterImage: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function UploadMoviePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminLoggedIn = localStorage.getItem("isAdmin") === "true";
      if (!adminLoggedIn) {
        router.push("/admin");
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeUrl: "",
      genre: "Action",
      language: "English",
      posterImage: undefined,
    },
  });

  function onSubmit(values: FormValues) {
    const posterFile = values.posterImage?.[0];
    const posterUrl = posterFile 
        ? URL.createObjectURL(posterFile) 
        : `https://placehold.co/400x600.png?text=${encodeURIComponent(values.title)}`;

    addMovie({
      title: values.title,
      description: values.description,
      youtubeUrl: values.youtubeUrl,
      genre: values.genre,
      language: values.language,
      posterUrl: posterUrl,
    });

    toast({
      title: "Movie Added!",
      description: `${values.title} has been successfully added to the library.`,
    });
    router.push("/movies");
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting to admin login...</p>
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

               <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Embed URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/embed/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="posterImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Poster</FormLabel>
                      {posterPreview && <Image src={posterPreview} alt="Poster preview" width={150} height={225} className="rounded-md border object-cover"/>}
                      <FormControl>
                         <Input 
                          type="file" 
                          accept="image/jpeg, image/png, image/webp"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              field.onChange(files);
                              setPosterPreview(URL.createObjectURL(files[0]));
                            } else {
                              field.onChange(undefined);
                              setPosterPreview(null);
                            }
                          }}
                        />
                      </FormControl>
                       <FormDescription>
                        Optional. If left blank, a placeholder image will be used.
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
