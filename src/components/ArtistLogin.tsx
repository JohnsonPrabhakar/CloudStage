
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getArtistProfile } from "@/lib/firebase-service";
import { FirebaseError } from "firebase/app";

const formSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export default function ArtistLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const artistProfile = await getArtistProfile(user.uid);

      if (artistProfile) {
        if (artistProfile.isApproved) {
          toast({
            title: "Login Successful",
            description: "Redirecting to your dashboard...",
          });
          router.push("/artist/dashboard");
        } else {
          toast({
            variant: "default",
            title: "Account Pending Approval",
            description: "Your artist profile is still under review. You will be redirected.",
          });
          router.push('/artist/pending');
        }
      } else {
        toast({
            title: "Profile Incomplete",
            description: "Please complete your artist profile to continue.",
        });
        router.push('/artist/register');
      }

    } catch (error) {
      console.error("Artist Login Failed:", error);
      let title = "Login Failed";
      let description = "An unexpected error occurred. Please try again.";

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            description = "Invalid email or password. Please double-check your credentials.";
            break;
          case 'auth/network-request-failed':
            description = "A network error occurred. Please check your internet connection and try again.";
            break;
          default:
            description = `An unexpected server error occurred. Please try again later. (${error.code})`;
            break;
        }
      }
      
      toast({ variant: "destructive", title, description });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-background p-4">
      <Card className="w-full max-w-sm">
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Artist Login</CardTitle>
                  <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input placeholder="you@artist.com" {...field} />
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
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                    <CardDescription>
                        Don&apos;t have an account?{" "}
                        <Link href="/artist/register" className="text-primary hover:underline">
                            Register here
                        </Link>
                    </CardDescription>
                </CardFooter>
            </form>
         </Form>
      </Card>
    </div>
  );
}
