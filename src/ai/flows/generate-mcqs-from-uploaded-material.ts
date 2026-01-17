'use server';

/**
 * @fileOverview Flow to generate MCQs from uploaded study materials using the Gemini API.
 *
 * - generateMcqsFromUploadedMaterial - A function that handles the MCQ generation process from uploaded documents.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
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

const generateMcqsFromUploadedMaterialFlow = ai.defineFlow(
  {
    name: 'generateMcqsFromUploadedMaterialFlow',
    inputSchema: GenerateMcqsFromUploadedMaterialInputSchema,
    outputSchema: GenerateMcqsFromUploadedMaterialOutputSchema,
  },
  async (input) => {
    // 1. Generate a Real Random Seed
    const randomSeed = Math.floor(Math.random() * 10000);

    // 2. Use ai.generate directly (More robust than definePrompt for files)
    const { output } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash'), // Explicitly use the fast/cheap model
      output: { 
        schema: GenerateMcqsFromUploadedMaterialOutputSchema 
      },
      config: {
        temperature: 0.5, // Balance between creativity and accuracy
      },
      prompt: [
        // A. Pass the File Explicitly as a Media Object
        // This assumes input.fileDataUri is a valid GS URI (gs://...) or Data URI (data:...)
        { 
          media: { url: input.fileDataUri } 
        },
        
        // B. Pass the Text Prompt with the Seed injected
        { 
          text: `You are an expert CA examiner. 
          
          Step 1: Using Random Seed ${randomSeed}, select a specific random chapter or concept from the attached document.
          Step 2: Generate ${input.count} MCQs with '${input.difficulty}' difficulty strictly from that section.

          Rules:
          - Each MCQ must have 4 options (A, B, C, D) and a detailed explanation.
          - Avoid generic questions. Test specific details.` 
        }
      ]
    });

    if (!output) throw new Error("AI failed to generate MCQs");
    
    return output;
  }
);
