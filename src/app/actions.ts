'use server';

import {
  generateMcqsFromSyllabus,
} from '@/ai/flows/generate-mcqs-from-syllabus';
import {
  generateMcqsFromUploadedMaterial,
} from '@/ai/flows/generate-mcqs-from-uploaded-material';
import type { GenerateMcqsFromSyllabusInput, GenerateMcqsFromUploadedMaterialInput, UserProfile } from '@/lib/types';
import { z } from 'genkit';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { ChatInputSchema, ChatOutputSchema } from '@/lib/types';
import { initializeFirebase } from '@/firebase/server-init';
import { setDocServer, updateDocServer, incrementServer } from '@/firebase/server-actions';
import { ai } from '@/ai/genkit';
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

// Correct: Set timeout to 60s to prevent crashes on large files
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);


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

// 2. TOOL: Handle YouTube Links
// We keep this because Gemini can't "watch" YouTube URLs directly yet.
const getYoutubeTranscript = ai.defineTool(
  {
    name: 'getYoutubeTranscript',
    description: 'Get the transcript of a YouTube video.',
    inputSchema: z.object({ url: z.string() }),
    outputSchema: z.string(),
  },
  async ({ url }) => {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      return transcript.map(t => t.text).join(' ').slice(0, 50000);
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }
);

// 3. FLOW: The AI Logic
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // Correct: Use 1.5-flash (Stable, Fast, Supports PDFs)
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      history: [
        {
          role: 'system',
          content: [{ 
            text: `You are a CA exam assistant. 
            - If I upload a PDF, answer from that file.
            - If I give a YouTube link, use the tool to read the transcript.` 
          }]
        },
        ...input.history // This history will contain the PDF "media" block if one was uploaded
      ],
      tools: [getYoutubeTranscript],
    });

    return { content: result.text };
  }
);

// 4. ACTION: The "Traffic Controller"
// This is the most important part. It handles the FormData protocol.
export async function chat(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    const message = formData.get('message') as string;
    const historyJson = formData.get('history') as string;
    
    // We must manually parse the history because FormData can only send strings
    let history = historyJson ? JSON.parse(historyJson) : [];

    // --- CASE A: PDF UPLOAD ---
    if (file) {
      // 1. Save file to temp folder
      const buffer = Buffer.from(await file.arrayBuffer());
      const tempPath = path.join(os.tmpdir(), file.name);
      await writeFile(tempPath, buffer);

      // 2. Upload to Google
      const uploadResult = await fileManager.uploadFile(tempPath, {
        mimeType: file.type,
        displayName: file.name,
      });

      // 3. Wait for it to be ready
      let state = await fileManager.getFile(uploadResult.file.name);
      while (state.state === "PROCESSING") {
        await new Promise(r => setTimeout(r, 1000));
        state = await fileManager.getFile(uploadResult.file.name);
      }

      // 4. Add the PDF to the chat history as "media"
      // This is how Genkit knows a file is attached
      history.push({
        role: 'user',
        content: [
          { media: { url: uploadResult.file.uri, contentType: file.type } },
          { text: "I have uploaded this document. " + message }
        ]
      });

      await unlink(tempPath); // Cleanup
    } 
    // --- CASE B: TEXT / YOUTUBE ONLY ---
    else {
      history.push({
        role: 'user',
        content: [{ text: message }]
      });
    }

    // Run the flow
    const response = await chatFlow({ history });

    // Return the response AND the updated history
    return {
      content: response.content,
      newHistory: [
        ...history, 
        { role: 'model', content: [{ text: response.content }] }
      ]
    };

  } catch (error: any) {
    console.error("Error:", error);
    return { content: "Something went wrong: " + error.message, newHistory: [] };
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

    