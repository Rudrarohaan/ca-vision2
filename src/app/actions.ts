'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { YoutubeTranscript } from 'youtube-transcript';
import { googleAI } from '@genkit-ai/google-genai';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import type { GenerateMcqsFromSyllabusInput, GenerateMcqsFromUploadedMaterialInput, UserProfile } from '@/lib/types';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import { setDocServer, updateDocServer, incrementServer } from '@/firebase/server-actions';
import {
  generateMcqsFromSyllabus,
} from '@/ai/flows/generate-mcqs-from-syllabus';
import {
  generateMcqsFromUploadedMaterial,
} from '@/ai/flows/generate-mcqs-from-uploaded-material';

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


// --- CHATBOT LOGIC ---

// --- CONFIGURATION ---
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

// --- SCHEMAS ---
const OutputSchema = z.object({
  answer: z.string().describe('The answer to the question, formatted in Markdown.'),
});

// --- TOOL ---
const getYoutubeTranscript = ai.defineTool(
  {
    name: 'getYoutubeTranscript',
    description: 'Returns the transcript of a YouTube video.',
    inputSchema: z.object({ url: z.string() }),
    outputSchema: z.string(),
  },
  async ({ url }) => {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      return transcript.map(t => t.text).join(' ').slice(0, 50000);
    } catch (e: any) {
      return `Error getting transcript: ${e.message}`;
    }
  }
);

// --- FLOW ---
const studyFlow = ai.defineFlow(
  {
    name: 'studyFlow',
    inputSchema: z.any(),
    outputSchema: OutputSchema,
  },
  async (input) => {
    // FIX: Split the incoming history
    // The LAST item in the array is the user's "Current Prompt"
    // Everything before it is "Conversation History"
    const allMessages = input.history || [];
    
    // Safety check: If empty, throw error
    if (allMessages.length === 0) throw new Error("No messages provided to AI.");

    const currentMessage = allMessages[allMessages.length - 1]; // Last item
    const previousHistory = allMessages.slice(0, -1); // All items except last

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      output: { schema: OutputSchema },
      tools: [getYoutubeTranscript],
      config: { temperature: 0.3 },
      
      // 1. SYSTEM PROMPT (Defines behavior)
      system: `You are a helpful CA (Chartered Accountancy) study assistant.
              - **PDFs**: If a PDF is attached, answer purely based on its content.
              - **YouTube**: If a YouTube link is provided, USE the tool to get the transcript.
              - **Text**: If just text, answer using your general knowledge.
              Format: Use **Bold** for key terms and Bullet points.`,

      // 2. HISTORY (Past context)
      history: previousHistory,

      // 3. PROMPT (The trigger for THIS generation - Critical Fix)
      prompt: currentMessage.content, 
    });

    if (!output) throw new Error("No response generated");
    return output;
  }
);

// --- SERVER ACTION ---
export async function getInstantStudyAssistance(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const question = formData.get('question') as string;

    // Validate Input
    if (!question && !file) throw new Error("Please provide a question or a file.");

    // Build the "Current Turn" object
    let currentTurnContent: any[] = [];

    // CASE 1: Handle PDF Upload
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const tempPath = path.join(os.tmpdir(), file.name);
      await writeFile(tempPath, buffer);

      const uploadResult = await fileManager.uploadFile(tempPath, {
        mimeType: file.type,
        displayName: file.name,
      });

      // Wait for processing
      let state = await fileManager.getFile(uploadResult.file.name);
      while (state.state === "PROCESSING") {
        await new Promise(r => setTimeout(r, 1000));
        state = await fileManager.getFile(uploadResult.file.name);
      }

      // Add File + Text to the current prompt content
      currentTurnContent = [
        { media: { url: uploadResult.file.uri, contentType: file.type } },
        { text: `Based on this document, answer: ${question}` }
      ];

      await unlink(tempPath); 
    } 
    // CASE 2: Text / YouTube Link
    else {
      currentTurnContent = [{ text: question }];
    }

    // Construct the History Array
    // We send this as a single item array because it's a "one-shot" interaction.
    // If you had a chat history, you would append this to it.
    const history = [
      {
        role: 'user',
        content: currentTurnContent
      }
    ];

    // Call Flow
    const result = await studyFlow({ history });

    return result;

  } catch (error: any) {
    console.error("Study Assistance Error:", error);
    return { answer: `Error: ${error.message}` };
  }
}


// --- USER PROFILE & STATS ACTIONS ---

export async function updateUserProfileAction(
  { uid, data }: { uid: string; data: Partial<Omit<UserProfile, 'email'>> }
) {
  try {
    const { auth, firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', uid);
    
    await setDocServer(userDocRef, data, { merge: true });

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
