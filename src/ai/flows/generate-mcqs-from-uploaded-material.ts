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

  First, identify the subject and exam level (Foundation, Intermediate, or Final) from the content of the uploaded study material.

  Then, generate {{count}} MCQs for the identified subject and level with {{difficulty}} difficulty, based on the content of the uploaded study material. Each MCQ should have four options (A, B, C, D), a correct answer, and a detailed explanation.
  
  Use the seed '{{{seed}}}' to ensure variability.

  Uploaded Material: {{media url=fileDataUri}}

  Ensure that the generated MCQs are relevant to the uploaded material and cover key concepts and topics.

  Output the MCQs in JSON format. Follow this schema: {{{$ref: 'GenerateMcqsFromUploadedMaterialOutputSchema'}}}`,
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
