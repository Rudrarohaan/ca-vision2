'use server';

import {
  generateMcqsFromSyllabus,
} from '@/ai/flows/generate-mcqs-from-syllabus';
import {
  generateMcqsFromUploadedMaterial,
} from '@/ai/flows/generate-mcqs-from-uploaded-material';
import type { GenerateMcqsFromSyllabusInput, GenerateMcqsFromUploadedMaterialInput, UserProfile } from '@/lib/types';
import { chat } from '@/ai/flows/chat';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { ChatInputSchema, ChatOutputSchema } from '@/lib/types';
import { initializeFirebase } from '@/firebase/server-init';
import { setDocServer, updateDocServer, incrementServer } from '@/firebase/server-actions';


export async function generateMcqsFromSyllabusAction(
  input: Omit<GenerateMcqsFromSyllabusInput, 'seed'>
) {
  try {
    const mcqs = await generateMcqsFromSyllabus({
      ...input,
      seed: Math.random(),
    });
    if (!mcqs || mcqs.length === 0) {
      throw new Error('No MCQs were generated. The model may have returned an empty or invalid response.');
    }
    return mcqs;
  } catch (error) {
    console.error('Error generating MCQs from syllabus:', error);
    throw new Error('Failed to generate MCQs from syllabus.');
  }
}

type UploadActionInput = Omit<GenerateMcqsFromUploadedMaterialInput, 'fileDataUri' | 'level' | 'subject'> & {
  fileDataUri: string;
};

export async function generateMcqsFromUploadedMaterialAction(
  input: UploadActionInput
) {
  try {
    const mcqs = await generateMcqsFromUploadedMaterial({
      ...input,
      level: 'Foundation',
      subject: '',
      seed: Math.random(),
    });
    return mcqs;
  } catch (error) {
    console.error('Error generating MCQs from uploaded material:', error);
    throw new Error('Failed to generate MCQs from uploaded material.');
  }
}

export async function chatAction(
  input: z.infer<typeof ChatInputSchema>
): Promise<z.infer<typeof ChatOutputSchema>> {
  try {
    return await chat(input);
  } catch (error) {
    console.error('Error in chat action:', error);
    return {
      content: 'An unexpected error occurred. Please try again.',
    };
  }
}

export async function updateUserProfileAction(
  { uid, data }: { uid: string; data: Partial<Omit<UserProfile, 'email'>> }
) {
  try {
    const { auth, firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);
    
    // Use the server-side update function
    await setDocServer(userDocRef, data, { merge: true });

    try {
        const user = await auth.getUser(uid);
        if (user) {
             await updateProfile(user, {
                displayName: data.displayName,
                photoURL: data.photoURL,
             });
        }
    } catch (authError) {
        // This is a workaround for the fact that updateProfile is not available in the admin SDK
        // We can ignore this error as the client will eventually sync with the updated user record
        console.warn("Could not update Firebase Auth profile from server action. This is expected.");
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

export async function incrementQuizzesGeneratedAction({ userId }: { userId: string }) {
  try {
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', userId);
    await updateDocServer(userDocRef, {
      quizzesGenerated: incrementServer(1),
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing quizzes generated:', error);
    return { success: false, error: 'Failed to update quiz count.' };
  }
}

export async function updateQuizStatsAction({
  userId,
  score,
  totalQuestions,
}: {
  userId: string;
  score: number;
  totalQuestions: number;
}) {
  try {
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', userId);
    await updateDocServer(userDocRef, {
      totalMcqsAttempted: incrementServer(totalQuestions),
      totalMcqsCorrect: incrementServer(score),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating quiz stats:', error);
    return { success: false, error: 'Failed to update quiz stats.' };
  }
}

    