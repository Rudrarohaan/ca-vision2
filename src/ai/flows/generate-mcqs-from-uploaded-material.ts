'use server';

/**
 * @fileOverview Flow to generate MCQs from uploaded study materials using the Gemini API.
 *
 * - generateMcqsFromUploadedMaterial - A function that handles the MCQ generation process from uploaded documents.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateMcqsFromUploadedMaterialInputSchema,
  GenerateMcqsFromUploadedMaterialOutputSchema,
} from '@/lib/types';
import type {
  GenerateMcqsFromUploadedMaterialInput,
  GenerateMcqsFromUploadedMaterialOutput,
} from '@/lib/types';

export async function generateMcqsFromUploadedMaterial(
  input: GenerateMcqsFromUploadedMaterialInput
): Promise<GenerateMcqsFromUploadedMaterialOutput> {
  return generateMcqsFromUploadedMaterialFlow(input);
}

const generateMcqsPrompt = ai.definePrompt({
  name: 'generateMcqsFromUploadedMaterialPrompt',
  input: {schema: GenerateMcqsFromUploadedMaterialInputSchema},
  output: {schema: GenerateMcqsFromUploadedMaterialOutputSchema},
  prompt: `You are an expert in generating multiple-choice questions (MCQs) for CA (Chartered Accountancy) exams.

  I want you to act as an examiner creating a quiz from the provided document.
  
  Step 1: Randomly select a specific chapter, page range, or concept from the middle or end of the document. (Random Seed: {{{seed}}}).
  Step 2: Generate {{count}} MCQs with {{difficulty}} difficulty strictly focused on that specific selected area.
  
  Each MCQ should have four options (A, B, C, D), a correct answer, and a detailed explanation.

  Uploaded Material: {{media url=fileDataUri}}

  Ensure the questions are not generic overview questions, but test specific details from the selected section.

  Output the MCQs in JSON format.`,
});

const generateMcqsFromUploadedMaterialFlow = ai.defineFlow(
  {
    name: 'generateMcqsFromUploadedMaterialFlow',
    inputSchema: GenerateMcqsFromUploadedMaterialInputSchema,
    outputSchema: GenerateMcqsFromUploadedMaterialOutputSchema,
  },
  async input => {
    const {output} = await generateMcqsPrompt(input);
    return output!;
  }
);
