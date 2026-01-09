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
import { getAuth, updateProfile } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { ChatInputSchema, ChatOutputSchema } from '@/lib/types';
import { initializeFirebase } from '@/firebase/server-init';


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
    // This is a server-side action, so we must initialize Firebase here.
    const { auth, firestore } = initializeFirebase();

    // We must trust the `uid` passed in, assuming authorization checks happened before calling this action.
    // For a real app, you would get the user from the session/token here to be secure.
    
    // Update Firestore document
    const userDocRef = doc(firestore, 'users', uid);
    // Ensure we are not trying to write undefined values to firestore
    const dataToSave = JSON.parse(JSON.stringify(data));
    await setDoc(userDocRef, dataToSave, { merge: true });

    // Note: We cannot update Firebase Auth's profile from a generic server action
    // because it requires the client's auth instance.
    // The displayName and photoURL should be updated on the client after sign-up/profile edit.
    // However, if this action is called from a client that has auth, we can try.
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
