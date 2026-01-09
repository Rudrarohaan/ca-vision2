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
import { doc, setDoc } from 'firebase/firestore';
import { ChatInputSchema, ChatOutputSchema } from '@/lib/types';
import { initializeFirebase } from '@/firebase/server-init';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


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
  { uid, data }: { uid: string; data: Partial<UserProfile> }
) {
  try {
    const { auth, firestore } = initializeFirebase();

    const userDocRef = doc(firestore, 'users', uid);
    
    // Use the non-blocking update with error handling built-in
    setDocumentNonBlocking(userDocRef, data, { merge: true });

    // This part runs on the server and might not have access to the client's currentUser.
    // The profile update on Firebase Auth should ideally be confirmed on the client-side
    // after the user object is updated.
    try {
        if (auth.currentUser && auth.currentUser.uid === uid) {
             await updateProfile(auth.currentUser, {
                displayName: data.displayName,
                photoURL: data.photoURL,
             });
        }
    } catch (authError) {
        console.warn("Could not update Firebase Auth profile from server action. This is expected if not called from an authenticated client context.", authError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
