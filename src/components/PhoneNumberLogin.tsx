"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { createUserProfileForPhoneAuth } from '@/lib/firebase-service';
import { FirebaseError } from 'firebase/app';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number with country code.'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits.').max(6),
});

/**
 * NOTE: This component is for future use in a wrapped mobile application (e.g., Capacitor).
 * It is not currently linked anywhere in the web application UI.
 */
export default function PhoneNumberLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (recaptchaContainerRef.current) {
      // Ensure the container is empty before creating a new verifier
      recaptchaContainerRef.current.innerHTML = '';
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current,
        {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow sign-in
          },
        }
      );
    }
  }, []);

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(
        auth,
        values.phone,
        appVerifier
      );
      setConfirmationResult(result);
      setShowOtpForm(true);
      toast({ title: 'OTP Sent', description: 'Please check your phone for the verification code.' });
    } catch (error) {
      console.error('Phone Sign-In Error:', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-phone-number') {
            description = 'The phone number is not valid. Please include the country code (e.g., +91).'
        }
      }
      toast({ variant: 'destructive', title: 'Failed to Send OTP', description });
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    if (!confirmationResult) return;
    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(values.otp);
      // User signed in successfully.
      await createUserProfileForPhoneAuth(userCredential.user);

      toast({
        title: 'Login Successful',
        description: 'Welcome to CloudStage!',
      });
      // In a real app, you might redirect to a user-specific dashboard
      router.push('/');
    } catch (error) {
      console.error('OTP Confirmation Error:', error);
      toast({ variant: 'destructive', title: 'Login Failed', description: 'The OTP was incorrect. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div ref={recaptchaContainerRef}></div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome to CloudStage</CardTitle>
          <CardDescription>
            {showOtpForm
              ? 'Enter the 6-digit code sent to your phone.'
              : 'Sign in with your phone number to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOtpForm ? (
            <Form {...phoneForm}>
              <form
                onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+91 98765 43210"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form
                onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
                 <Button variant="link" onClick={() => setShowOtpForm(false)} className="w-full">
                    Change phone number
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Extend the Window interface to include the reCAPTCHA verifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
