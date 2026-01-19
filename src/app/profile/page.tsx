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
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Linkedin, Twitter, Instagram, Upload } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore, useDoc, useMemoFirebase, useAuth, useStorage } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfile } from 'firebase/auth';

// Helper to get the last part of a URL path, which we assume is the username
const getUsernameFromUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  // If it's already a username (doesn't start with http), return it directly.
  if (!url.startsWith('http')) return url;
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(p => p);
    return parts[parts.length - 1] || '';
  } catch (e) {
    // If parsing fails, it's likely not a valid URL, so return the raw string.
    return url;
  }
};


const profileSchema = z.object({
  displayName: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  icaiRegistrationNumber: z.string().optional(),
  caLevel: z.enum(['Foundation', 'Intermediate', 'Final']).optional(),
  photoURL: z.string().url().optional().or(z.literal('')),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

// We only want to update a subset of fields.
const updatableProfileSchema = profileSchema.omit({ email: true });


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firestore = useFirestore();
  const auth = useAuth();
  const storage = useStorage();

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
      icaiRegistrationNumber: '',
      photoURL: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        instagram: '',
      },
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || user?.displayName || '',
        email: userProfile.email || user?.email || '',
        bio: userProfile.bio || '',
        icaiRegistrationNumber: userProfile.icaiRegistrationNumber || '',
        caLevel: userProfile.caLevel,
        photoURL: userProfile.photoURL || user?.photoURL || '',
        socialLinks: {
          twitter: getUsernameFromUrl(userProfile.socialLinks?.twitter),
          linkedin: getUsernameFromUrl(userProfile.socialLinks?.linkedin),
          instagram: getUsernameFromUrl(userProfile.socialLinks?.instagram),
        },
      });
    } else if (user && !isProfileLoading) {
      // When we only have the auth user, reset the full form shape
      // to avoid fields becoming uncontrolled.
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        bio: '',
        icaiRegistrationNumber: '',
        caLevel: undefined,
        socialLinks: {
          twitter: '',
          linkedin: '',
          instagram: '',
        },
      });
    }
  }, [user, userProfile, isProfileLoading, form]);
  
  async function onSubmit(values: z.infer<typeof updatableProfileSchema>) {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      const userDoc = doc(firestore, 'users', user.uid);
      const { socialLinks, ...restOfValues } = values;
      
      const dataToSave = {
        ...restOfValues,
        socialLinks: {
            twitter: socialLinks?.twitter ? `https://x.com/${socialLinks.twitter.split('/').pop()}` : '',
            linkedin: socialLinks?.linkedin ? `https://linkedin.com/in/${socialLinks.linkedin.split('/').pop()}` : '',
            instagram: socialLinks?.instagram ? `https://instagram.com/${socialLinks.instagram.split('/').pop()}` : '',
        },
        updatedAt: new Date().toISOString(),
      };
      
      // Update Firestore document
      await setDoc(userDoc, dataToSave, { merge: true });

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: values.displayName,
        photoURL: values.photoURL
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });

    } catch (error: any) {
        console.error("Error updating profile:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "Could not update your profile.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !auth.currentUser) return;

    setIsUploading(true);
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the form state locally
      form.setValue('photoURL', downloadURL, { shouldDirty: true });
      
      // Update Firestore and Auth profile in parallel
      await Promise.all([
        setDoc(doc(firestore, 'users', user.uid), { photoURL: downloadURL, updatedAt: new Date().toISOString() }, { merge: true }),
        updateProfile(auth.currentUser, { photoURL: downloadURL })
      ]);
      
      toast({
        title: 'Profile Picture Updated',
        description: 'Your new picture has been saved.',
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload your profile picture.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
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
    if (names.length > 1 && names[names.length-1]) {
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
                <div className="relative">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                      <AvatarImage src={form.watch('photoURL')} alt={form.watch('displayName')} />
                      <AvatarFallback>{getInitials(form.watch('displayName'))}</AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  {(isUploading) && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                   <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer" onClick={handleAvatarClick}>
                        <Upload className="h-4 w-4" />
                    </div>
                </div>
                <div className="flex-1">
                  <CardTitle>Your Profile</CardTitle>
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
                    name="icaiRegistrationNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>ICAI Registration No.</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., NRO123456" {...field} />
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
                                        <Input placeholder="username" {...field} className="pl-10" />
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
                                        <Input placeholder="username" {...field} className="pl-10" />
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
                                        <Input placeholder="username" {...field} className="pl-10" />
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
  );
}
