'use server';

/**
 * @fileOverview Flow to generate MCQs from uploaded study materials using the Gemini API.
 *
 * - generateMcqsFromUploadedMaterial - A function that handles the MCQ generation process from uploaded documents.
 * - GenerateMcqsFromUploadedMaterialInput - The input type for the generateMcqsFromUploadedMaterial function.
 * - GenerateMcqsFromUploadedMaterialOutput - The return type for the generateMcqsFromUploadedMaterial function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMcqsFromUploadedMaterialInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A data URI of the uploaded study material (PDF, DOCX, TXT) that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  level: z.string().describe('The level of the CA exam: Foundation, Intermediate, or Final. This will be derived from the content.').optional(),
  subject: z.string().describe('The subject for which MCQs are generated. This will be derived from the content.').optional(),
  difficulty: z.string().describe('The difficulty level of the MCQs: Easy, Medium, or Hard.'),
  count: z.number().describe('The number of MCQs to generate (5-50 range).'),
});

export type GenerateMcqsFromUploadedMaterialInput = z.infer<typeof GenerateMcqsFromUploadedMaterialInputSchema>;

const McqSchema = z.object({
  id: z.number().describe('The unique identifier for the MCQ.'),
  question: z.string().describe('The text of the multiple-choice question.'),
  options: z.object({
    A: z.string().describe('Option A.'),
    B: z.string().describe('Option B.'),
    C: z.string().describe('Option C.'),
    D: z.string().describe('Option D.'),
  }).describe('The multiple choice options for the question'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']).describe('The correct answer option (A, B, C, or D).'),
  explanation: z.string().describe('An explanation of the correct answer.'),
});

const GenerateMcqsFromUploadedMaterialOutputSchema = z.array(McqSchema);

export type GenerateMcqsFromUploadedMaterialOutput = z.infer<typeof GenerateMcqsFromUploadedMaterialOutputSchema>;

export async function generateMcqsFromUploadedMaterial(input: GenerateMcqsFromUploadedMaterialInput): Promise<GenerateMcqsFromUploadedMaterialOutput> {
  return generateMcqsFromUploadedMaterialFlow(input);
}

const generateMcqsPrompt = ai.definePrompt({
  name: 'generateMcqsFromUploadedMaterialPrompt',
  input: {schema: GenerateMcqsFromUploadedMaterialInputSchema},
  output: {schema: GenerateMcqsFromUploadedMaterialOutputSchema},
  prompt: `You are an expert in generating multiple-choice questions (MCQs) for CA (Chartered Accountancy) exams.

  First, identify the subject and exam level (Foundation, Intermediate, or Final) from the content of the uploaded study material.

  Then, generate {{count}} MCQs for the identified subject and level with {{difficulty}} difficulty, based on the content of the uploaded study material. Each MCQ should have four options (A, B, C, D), a correct answer, and a detailed explanation.

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
