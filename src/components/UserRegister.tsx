
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/firebase-service";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().min(10, "Please enter a valid phone number.").optional().or(z.literal('')),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function UserRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await createUserProfile(user, {
        fullName: values.fullName,
        phone: values.phone || '',
      });
      
      toast({
        title: "Registration Successful!",
        description: "You've been logged in automatically.",
      });

      const redirectUrl = searchParams.get('redirect');
      router.push(redirectUrl || '/');

    } catch (error) {
      console.error("User registration failed:", error);
      let description = "An unexpected error occurred.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          description = "This email is already registered. Please log in instead.";
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
    <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>Join CloudStage to book tickets and follow artists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
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
                {loading ? "Creating Account..." : "Register"}
              </Button>
              <CardDescription>
                Already have an account?{" "}
                <Link href={`/user/login?redirect=${searchParams.get('redirect') || ''}`} className="text-primary hover:underline">
                  Log in
                </Link>
              </CardDescription>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
