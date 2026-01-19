'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, MessageSquare, ArrowRight } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    // If the user is logged in, but we're not loading a profile and no profile exists, create one client-side.
    if (user && !isProfileLoading && !userProfile && firestore) {
      const newUserProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quizzesGenerated: 0,
        totalMcqsAttempted: 0,
        totalMcqsCorrect: 0,
      };

      const userDoc = doc(firestore, 'users', user.uid);
      setDoc(userDoc, newUserProfile, { merge: true })
        .catch((error) => {
          console.error("DashboardPage: Failed to create user profile:", error);
          toast({
            variant: "destructive",
            title: "Profile Creation Failed",
            description: "Could not create your user profile. Please try logging in again.",
          });
        });
    }
  }, [user, userProfile, isProfileLoading, firestore, toast]);


  const overallAnalytics = useMemo(() => {
    if (!userProfile) {
      return {
        totalAttempted: 0,
        overallAccuracy: 0,
        mcqsGenerated: 0,
      };
    }
    const accuracy =
      userProfile.totalMcqsAttempted && userProfile.totalMcqsAttempted > 0
        ? Math.round(
            ((userProfile.totalMcqsCorrect || 0) /
              userProfile.totalMcqsAttempted) *
              100
          )
        : 0;

    return {
      totalAttempted: userProfile.totalMcqsAttempted || 0,
      overallAccuracy: accuracy,
      mcqsGenerated: userProfile.quizzesGenerated || 0,
    };
  }, [userProfile]);

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          Welcome back, {userProfile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'CA Aspirant'}!
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              MCQ Generator
            </CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create custom multiple-choice questions from syllabus or uploaded
              materials.
            </CardDescription>
          </CardContent>
          <CardContent>
            <Link href="/mcq-generator">
              <Button>
                Start Generating <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Chatbot</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Get instant answers to your CA-related questions.
            </CardDescription>
          </CardContent>
          <CardContent>
            <Link href="/chat">
              <Button>
                Start Chatting <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>
              A quick look at your MCQ stats.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             {isProfileLoading ? (
                <>
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </>
             ) : (
                <>
                    <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg">
                        <p className="text-4xl font-bold text-primary">{overallAnalytics.totalAttempted}</p>
                        <p className="text-sm text-muted-foreground">Attempted</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg">
                        <p className="text-4xl font-bold text-primary">{overallAnalytics.overallAccuracy}%</p>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg">
                        <p className="text-4xl font-bold text-primary">{overallAnalytics.mcqsGenerated}</p>
                        <p className="text-sm text-muted-foreground">Quizzes Generated</p>
                    </div>
                </>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
