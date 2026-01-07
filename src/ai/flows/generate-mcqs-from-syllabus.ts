'use server';
/**
 * @fileOverview A flow to generate MCQs from the syllabus based on the selected exam level, group, subject, and difficulty.
 *
 * - generateMcqsFromSyllabus - A function that handles the MCQ generation process.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateMcqsFromSyllabusInputSchema,
  GenerateMcqsFromSyllabusOutputSchema,
} from '@/lib/types';
import type {
  GenerateMcqsFromSyllabusInput,
  GenerateMcqsFromSyllabusOutput,
} from '@/lib/types';

export async function generateMcqsFromSyllabus(
  input: GenerateMcqsFromSyllabusInput
): Promise<GenerateMcqsFromSyllabusOutput> {
  return generateMcqsFromSyllabusFlow(input);
}

const generateMcqsPrompt = ai.definePrompt({
  name: 'generateMcqsFromSyllabusPrompt',
  input: {schema: GenerateMcqsFromSyllabusInputSchema},
  output: {schema: GenerateMcqsFromSyllabusOutputSchema},
  prompt: `You are an expert in creating multiple-choice questions (MCQs) for CA (Chartered Accountancy) exams.

  Generate {{{count}}} MCQs for the {{{level}}} level, {{{subject}}} subject with {{{difficulty}}} difficulty.
  
  Use the seed '{{{seed}}}' to ensure variability.

  The MCQs should have four options (A, B, C, D), a correct answer, and a brief explanation.

  Ensure that the questions are relevant to the syllabus and appropriate for the specified difficulty level.

  Return the MCQs in the following JSON format:
  {{GenerateMcqsFromSyllabusOutputSchema}}`,
});

const generateMcqsFromSyllabusFlow = ai.defineFlow(
  {
    name: 'generateMcqsFromSyllabusFlow',
    inputSchema: GenerateMcqsFromSyllabusInputSchema,
    outputSchema: GenerateMcqsFromSyllabusOutputSchema,
  },
  async input => {
    const {output} = await generateMcqsPrompt(input);
    return output!;
  }
);
