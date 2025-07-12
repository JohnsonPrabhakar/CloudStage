
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile, type User } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "@/lib/firebase-service";
import { Loader2, UserCircle, ChevronLeft } from "lucide-react";
import { type UserProfile as UserProfileType } from "@/lib/types";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Please enter a valid phone number.").optional().or(z.literal('')),
});

export default function UserProfile() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userProfile = await getUserProfile(currentUser.uid);
          if (userProfile) {
            form.reset({
              fullName: userProfile.fullName,
              phone: userProfile.phone || "",
            });
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          toast({ variant: "destructive", title: "Could not load your profile." });
        }
      } else {
        router.push("/user/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUserProfile(user.uid, values);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: values.fullName });
      }

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><UserCircle /> Edit Your Profile</CardTitle>
          <CardDescription>Update your personal information below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
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
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
