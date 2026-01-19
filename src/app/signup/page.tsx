'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  initiateEmailSignUp,
} from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect, useState } from 'react';
import { createUserProfileAction } from '../actions';
import { updateProfile } from 'firebase/auth';

const signupSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    // When user object becomes available, update profile and redirect
    if (user && !isUserLoading && isSubmitting && !isProfileUpdating) {
      setIsProfileUpdating(true);
      const values = form.getValues();
      
      // 1. Update the Auth user profile first (client-side)
      updateProfile(user, { displayName: values.displayName })
        .then(() => {
          // 2. Create the Firestore document (server-side)
          createUserProfileAction({
            uid: user.uid,
            email: user.email!, // user.email will be present after signup
            displayName: values.displayName
          }).then(() => {
            router.push('/');
          });
        });

    } else if (user && !isUserLoading && !isSubmitting) {
      // If user is already logged in and not in the process of signing up, redirect
      router.push('/');
    }
  }, [user, isUserLoading, router, isSubmitting, form, isProfileUpdating]);


  function onSubmit(values: z.infer<typeof signupSchema>) {
    if (!auth) return;
    setIsSubmitting(true);
    initiateEmailSignUp(auth, values.email, values.password);
  }

  if (isUserLoading || (user && !isSubmitting)) {
     return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
       <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#1877f222,transparent)]"></div>
      </div>
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 glow-soft">
            <BrainCircuit className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>
            Join CA Exam Prep to start your journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="John Doe" {...field} className="pl-10" />
                        </div>
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
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="m@example.com" {...field} className="pl-10" />
                        </div>
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
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type="password" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full !mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-105" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline text-primary">
                Sign in
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
