import {z} from 'genkit';

export const MCQSchema = z.object({
  id: z.number(),
  question: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string(),
});

export type MCQ = z.infer<typeof MCQSchema>;

export const GenerateMcqsFromSyllabusInputSchema = z.object({
  level: z.enum(['Foundation', 'Intermediate', 'Final']),
  group: z.enum(['Group I', 'Group II']).optional(),
  subject: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  count: z.number().min(5).max(50),
  seed: z.number().optional(),
});

export type GenerateMcqsFromSyllabusInput = z.infer<
  typeof GenerateMcqsFromSyllabusInputSchema
>;

export const GenerateMcqsFromSyllabusOutputSchema = z.array(MCQSchema);

export type GenerateMcqsFromSyllabusOutput = z.infer<
  typeof GenerateMcqsFromSyllabusOutputSchema
>;

export const GenerateMcqsFromUploadedMaterialInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A data URI of the uploaded study material (PDF, DOCX, TXT) that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  level: z
    .string()
    .describe(
      'The level of the CA exam: Foundation, Intermediate, or Final. This will be derived from the content.'
    )
    .optional(),
  subject: z
    .string()
    .describe('The subject for which MCQs are generated. This will be derived from the content.')
    .optional(),
  difficulty: z.string().describe('The difficulty level of the MCQs: Easy, Medium, or Hard.'),
  count: z.number().describe('The number of MCQs to generate (5-50 range).'),
  seed: z.number().optional(),
});

export type GenerateMcqsFromUploadedMaterialInput = z.infer<
  typeof GenerateMcqsFromUploadedMaterialInputSchema
>;

export const GenerateMcqsFromUploadedMaterialOutputSchema = z.array(MCQSchema);

export type GenerateMcqsFromUploadedMaterialOutput = z.infer<
  typeof GenerateMcqsFromUploadedMaterialOutputSchema
>;
