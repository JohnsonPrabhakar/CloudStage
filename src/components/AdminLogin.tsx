
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { doc, setDoc, getDoc } from "firebase/firestore";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function AdminLogin() {
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

    // The security rules use the admin email, so we must check it on the client
    // before attempting any Firestore operations that require admin privileges.
    if (values.email !== "admin@cloudstage.in") {
        toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have admin privileges.",
        });
        setLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const adminDocRef = doc(db, 'admins', userCredential.user.uid);
      
      // As a fallback, create the admin document if it doesn't exist.
      // This is allowed by the security rule: `allow create: if isAdmin();`
      const adminDoc = await getDoc(adminDocRef);
      if (!adminDoc.exists()) {
        await setDoc(adminDocRef, { role: "admin", createdAt: new Date() });
      }
      
      toast({
        title: "Login Successful",
        description: "Redirecting to admin dashboard...",
      });
      router.push("/admin/dashboard");

    } catch (error) {
       let title = "Login Failed";
       let description = "An unexpected error occurred. Please try again.";

       if (error instanceof FirebaseError) {
         switch (error.code) {
           case 'auth/user-not-found':
           case 'auth/wrong-password':
           case 'auth/invalid-credential':
             description = "Invalid email or password.";
             break;
           default:
             description = "An error occurred during login. Please try again.";
             break;
         }
       }
      
      toast({
        variant: "destructive",
        title,
        description,
      });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter admin credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@cloudstage.in" {...field} />
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    