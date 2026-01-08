'use server';

import {
  generateMcqsFromSyllabus,
} from '@/ai/flows/generate-mcqs-from-syllabus';
import {
  generateMcqsFromUploadedMaterial,
} from '@/ai/flows/generate-mcqs-from-uploaded-material';
import type { GenerateMcqsFromSyllabusInput, GenerateMcqsFromUploadedMaterialInput, UserProfile, ChatInputSchema, ChatOutputSchema } from '@/lib/types';
import { chat } from '@/ai/flows/chat';
import { z } from 'zod';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';


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
    const auth = getAuth(getApp());
    const user = auth.currentUser;

    if (user && user.uid === uid) {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
      
      // Update Firestore document
      const db = getFirestore(getApp());
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, data, { merge: true });

      return { success: true };
    } else {
      throw new Error('User not authenticated or mismatched user ID.');
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
