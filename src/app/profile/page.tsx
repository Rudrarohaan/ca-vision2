'use client';

import { useUser } from '@/firebase/auth/use-user';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useForm, Controller } from 'react-hook-form';
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
import { useEffect, useState, useMemo } from 'react';
import { updateUserProfileAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  city: z.string().optional(),
  caLevel: z.enum(['Foundation', 'Intermediate', 'Final']).optional(),
  photoURL: z.string().url().optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      email: '',
      bio: '',
      city: '',
      photoURL: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        instagram: '',
      },
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || user?.displayName || '',
        email: userProfile.email || user?.email || '',
        bio: userProfile.bio || '',
        city: userProfile.city || '',
        caLevel: userProfile.caLevel,
        photoURL: userProfile.photoURL || user?.photoURL || '',
        socialLinks: {
          twitter: userProfile.socialLinks?.twitter || '',
          linkedin: userProfile.socialLinks?.linkedin || '',
          instagram: userProfile.socialLinks?.instagram || '',
        },
      });
    } else if (user && !isProfileLoading) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
      });
    }
  }, [user, userProfile, isProfileLoading, form]);
  
  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    const result = await updateUserProfileAction({ uid: user.uid, data: values });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  }
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 items-center">
            <CardHeader className="items-center">
                <Avatar className="h-24 w-24 mb-2">
                    <AvatarImage src={form.watch('photoURL')} alt={form.watch('displayName')} />
                    <AvatarFallback>{getInitials(form.watch('displayName'))}</AvatarFallback>
                </Avatar>
                <CardTitle>{form.watch('displayName')}</CardTitle>
                <CardDescription>{form.watch('email')}</CardDescription>
            </CardHeader>
        </Card>
        <div className="md:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>
                    Manage your personal information and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                        <Input placeholder="m@example.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Tell us a little bit about yourself" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Mumbai" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="caLevel"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>CA Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select your level" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Foundation">Foundation</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Final">Final</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Social Links</Label>
                    <div className="space-y-4 mt-2">
                          <FormField
                            control={form.control}
                            name="socialLinks.twitter"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                          <div className="relative">
                                            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input placeholder="https://twitter.com/username" {...field} className="pl-10" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="socialLinks.linkedin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input placeholder="https://linkedin.com/in/username" {...field} className="pl-10" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="socialLinks.instagram"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input placeholder="https://instagram.com/username" {...field} className="pl-10" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                  </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
