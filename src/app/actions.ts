'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenerateMcqsFromSyllabusInput, GenerateMcqsFromUploadedMaterialInput, UserProfile } from '@/lib/types';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import { setDocServer } from '@/firebase/server-actions';
import {
  generateMcqsFromSyllabus,
} from '@/ai/flows/generate-mcqs-from-syllabus';
import {
  generateMcqsFromUploadedMaterial,
} from '@/ai/flows/generate-mcqs-from-uploaded-material';

// Helper function to handle AI errors
const handleAiError = (error: unknown): Error => {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  
  if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
    return new Error('The AI service is currently busy and cannot handle your request. Please try again in a moment.');
  }
  
  return new Error(errorMessage);
}


export async function generateMcqsFromSyllabusAction(
  input: Omit<GenerateMcqsFromSyllabusInput, 'seed'>
) {
  try {
    const mcqs = await generateMcqsFromSyllabus({
      ...input,
      seed: Math.random(),
    });
    if (!mcqs || mcqs.length === 0) {
      return { data: null, error: 'No MCQs were generated. The model may have returned an empty or invalid response.' };
    }
    return { data: mcqs, error: null };
  } catch (error) {
    const err = handleAiError(error);
    return { data: null, error: err.message };
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
    if (!mcqs || mcqs.length === 0) {
      return { data: null, error: 'No MCQs were generated from the uploaded file. The model may have returned an empty or invalid response.' };
    }
    return { data: mcqs, error: null };
  } catch (error) {
    const err = handleAiError(error);
    return { data: null, error: err.message };
  }
}


// --- CHATBOT LOGIC ---
const GetInstantStudyAssistanceInputSchema = z.object({
  question: z.string().describe('The CA-related question to be answered.'),
});
export type GetInstantStudyAssistanceInput = z.infer<typeof GetInstantStudyAssistanceInputSchema>;

const GetInstantStudyAssistanceOutputSchema = z.object({
  answer: z.string().min(1).describe('The answer to the question, formatted in Markdown.'),
});
export type GetInstantStudyAssistanceOutput = z.infer<typeof GetInstantStudyAssistanceOutputSchema>;

const getInstantStudyAssistancePrompt = ai.definePrompt({
  name: 'getInstantStudyAssistancePrompt',
  input: {schema: GetInstantStudyAssistanceInputSchema},
  output: {schema: GetInstantStudyAssistanceOutputSchema},
  prompt: `You are a helpful AI assistant for CA (Chartered Accountancy) students.
Your goal is to provide accurate, well-structured, and easy-to-read answers to their questions.

Format your response using simple Markdown. Use the following:
- **Bold text** for emphasis and key terms (using double asterisks).
- Bullet points for lists or steps (using a hyphen and a space: '- ').

Start with a direct answer, then provide a more detailed explanation if needed.

Question: {{{question}}}

Answer:`,
});

const getInstantStudyAssistanceFlow = ai.defineFlow(
  {
    name: 'getInstantStudyAssistanceFlow',
    inputSchema: GetInstantStudyAssistanceInputSchema,
    outputSchema: GetInstantStudyAssistanceOutputSchema,
  },
  async (input) => {
    const { output } = await getInstantStudyAssistancePrompt(input);
    if (!output) {
        throw new Error("The AI model returned an empty response.");
    }
    return output;
  }
);

export async function getInstantStudyAssistance(input: GetInstantStudyAssistanceInput) {
    try {
        const result = await getInstantStudyAssistanceFlow(input);
        const validation = GetInstantStudyAssistanceOutputSchema.safeParse(result);
        if (!validation.success) {
            console.error("AI response validation failed:", validation.error);
            return { data: null, error: "The AI model failed to return a response that matched the required format. Please try again." };
        }
        return { data: validation.data, error: null };
    } catch(error) {
        const err = handleAiError(error);
        return { data: null, error: err.message };
    }
}


// --- USER PROFILE & STATS ACTIONS ---

export async function createUserProfileAction({
  uid,
  email,
  displayName,
  photoURL,
}: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}) {
  try {
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);

    const newUserProfile: UserProfile = {
      id: uid,
      email: email,
      displayName: displayName,
      photoURL: photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quizzesGenerated: 0,
      totalMcqsAttempted: 0,
      totalMcqsCorrect: 0,
    };
    
    await setDocServer(userDocRef, newUserProfile, {});
    return { success: true };

  } catch (error) {
    console.error('Error creating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

export async function updateUserProfileAction(
  { uid, data }: { uid: string; data: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>> }
) {
  try {
    const { auth, firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);
    
    const dataToSave = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await setDocServer(userDocRef, dataToSave, { merge: true });

    // This is a client-side only API, so it will fail in a server action.
    // It's best to handle profile updates like displayName and photoURL
    // directly on the client after the user authenticates or when they
    // explicitly change it on their profile page.
    try {
        const user = auth.currentUser;
        if (user) {
             await updateProfile(user, {
                displayName: data.displayName,
                photoURL: data.photoURL,
             });
        }
    } catch (authError) {
        console.warn("Could not update Firebase Auth profile from server action. This is expected.");
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
