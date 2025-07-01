
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { registerArtist } from "@/lib/firebase-service";
import { FirebaseError } from "firebase/app";

const artistCategories = ['Music', 'Stand-up Comedy', 'Yoga', 'Magic', 'Devotional'] as const;

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  location: z.string().min(2, "Location is required."),
  about: z.string().min(20, "Please tell us a bit more about you (at least 20 characters)."),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  experience: z.coerce.number().min(0, "Experience can't be negative."),
  category: z.enum(artistCategories),
  subCategory: z.string().min(2, "Sub-category is required (e.g., Rock, Sufi).")
});

export default function ArtistRegister() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      location: "",
      about: "",
      instagramUrl: "",
      facebookUrl: "",
      youtubeUrl: "",
      experience: 0,
      subCategory: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        await registerArtist({
            ...values,
            youtubeUrl: values.youtubeUrl || "",
            instagramUrl: values.instagramUrl || "",
            facebookUrl: values.facebookUrl || "",
        });

        toast({
            title: "Registration Submitted!",
            description: "Your profile is now pending admin approval. You will be redirected to the login page.",
        });

        router.push("/artist/login");

    } catch (error) {
        console.error("Registration failed:", error);
        let description = "An unexpected error occurred. Please try again.";

        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/email-already-in-use':
              description = "This email address is already registered. Please try logging in instead.";
              form.setError("email", {
                  type: "server",
                  message: "This email is already in use. Please log in.",
              });
              break;
            case 'auth/invalid-email':
                description = "The email address is not valid. Please check and try again.";
                form.setError("email", { type: "server", message: description });
                break;
            case 'auth/weak-password':
                description = "The password is too weak. It must be at least 8 characters.";
                form.setError("password", { type: "server", message: description });
                break;
            case 'auth/network-request-failed':
              description = "A network error occurred. Please check your internet connection.";
              break;
            default:
              description = "An error occurred during registration. Please try again later.";
              break;
          }
        }
        
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description,
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Artist Registration</CardTitle>
          <CardDescription>
            Join CloudStage! Fill out your profile to start creating events. Already have an account?{" "}
            <Link href="/artist/login" className="text-primary hover:underline">Log in</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artist/Band Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Rockers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@artist.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience (years)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About / Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell everyone what makes you special..." className="resize-y min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {artistCategories.map(cat => (
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
                  name="subCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-category / Genre</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hard Rock, Sufi, Classical" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Social Links (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="youtubeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube Channel</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Profile</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Page</FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full md:w-auto" disabled={loading}>
                {loading ? "Submitting..." : "Submit for Approval"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
