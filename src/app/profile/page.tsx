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
import { useEffect, useState, useMemo, useRef } from 'react';
import { updateUserProfileAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Linkedin, Twitter, Upload, Camera, Instagram } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  city: z.string().optional(),
  caLevel: z.enum(['Foundation', 'Intermediate', 'Final']).optional(),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
  }).optional(),
  photoURL: z.string().url().optional(),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const firestore = useFirestore();
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      socialLinks: {
        twitter: '',
        linkedin: '',
        instagram: '',
      },
      photoURL: '',
    },
  });
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    const fileRef = storageRef(storage, `profile-pictures/${user.uid}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        toast({
          title: 'Upload Failed',
          description: 'Could not upload your profile picture. Please try again.',
          variant: 'destructive',
        });
        setUploadProgress(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        form.setValue('photoURL', downloadURL);
        await onSubmit(form.getValues());
        setUploadProgress(null);
      }
    );
  };


  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
      });
    }
    if (userProfile) {
        form.reset({
            ...form.getValues(),
            bio: userProfile.bio || '',
            city: userProfile.city || '',
            caLevel: userProfile.caLevel,
            socialLinks: {
                twitter: userProfile.socialLinks?.twitter || '',
                linkedin: userProfile.socialLinks?.linkedin || '',
                instagram: userProfile.socialLinks?.instagram || '',
            },
        })
    }
  }, [user, userProfile, form]);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

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
      await user?.reload(); 
      router.refresh();

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
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardHeader className="flex flex-row items-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                        <Avatar className="h-24 w-24 mb-2 cursor-pointer" onClick={handleAvatarClick}>
                            <AvatarImage src={form.watch('photoURL')} alt={form.getValues('displayName')} />
                            <AvatarFallback>{getInitials(form.getValues('displayName'))}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 h-24 w-24 rounded-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    {uploadProgress !== null && (
                        <div className="w-full px-4">
                            <Progress value={uploadProgress} className="h-1 w-20" />
                        </div>
                    )}
                  </div>
                  <div className='space-y-1'>
                    <CardTitle className="font-headline text-3xl">Your Profile</CardTitle>
                    <CardDescription>
                        Manage your personal information and preferences.
                    </CardDescription>
                  </div>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            <Input placeholder="https://x.com/username" {...field} className="pl-10" />
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

                <Button type="submit" disabled={isSubmitting || uploadProgress !== null}>
                    {(isSubmitting || uploadProgress !== null) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
                </CardContent>
            </Card>
          </form>
        </Form>
    </div>
  );
}

    