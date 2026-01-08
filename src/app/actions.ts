'use server';

import {
  generateMcqsFromSyllabus,
} from '@/ai/flows/generate-mcqs-from-syllabus';
import {
  generateMcqsFromUploadedMaterial,
} from '@/ai/flows/generate-mcqs-from-uploaded-material';
import type { GenerateMcqsFromSyllabusInput, GenerateMcqsFromUploadedMaterialInput } from '@/lib/types';
import { chat, ChatInputSchema, ChatOutputSchema } from '@/ai/flows/chat';
import { z } from 'zod';


export async function generateMcqsFromSyllabusAction(
  input: Omit<GenerateMcqsFromSyllabusInput, 'seed'>
) {
  try {
    const mcqs = await generateMcqsFromSyllabus({
      ...input,
      seed: Math.random(),
    });
    return mcqs;
  } catch (error) {
    console.error('Error generating MCQs from syllabus:', error);
    throw new Error('Failed to generate MCQs from syllabus.');
  }
}

type UploadActionInput = Omit<GenerateMcqsFromUploadedMaterialInput, 'fileDataUri' | 'level' | 'subject' | 'seed'> & {
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
