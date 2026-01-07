'use server';

import {
  generateMcqsFromSyllabus,
  type GenerateMcqsFromSyllabusInput,
} from '@/ai/flows/generate-mcqs-from-syllabus';
import {
  generateMcqsFromUploadedMaterial,
  type GenerateMcqsFromUploadedMaterialInput,
} from '@/ai/flows/generate-mcqs-from-uploaded-material';

export async function generateMcqsFromSyllabusAction(
  input: GenerateMcqsFromSyllabusInput
) {
  try {
    const mcqs = await generateMcqsFromSyllabus(input);
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
    });
    return mcqs;
  } catch (error) {
    console.error('Error generating MCQs from uploaded material:', error);
    throw new Error('Failed to generate MCQs from uploaded material.');
  }
}
