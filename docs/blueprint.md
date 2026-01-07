# **App Name**: CA Exam Prep

## Core Features:

- Level Selection: Allow users to select the CA exam level: Foundation, Intermediate, or Final.
- Dynamic Subject Selection: Dynamically display subjects based on the selected level and group (where applicable).
- MCQ Generation via Gemini: Generate MCQs using the Gemini API based on selected level, subject, and difficulty. An edge function uses a Lovable AI Gateway with a Gemini model to return an array of MCQ objects.
- Custom Content Upload: Allow users to upload study materials (PDF, DOCX, TXT) to generate MCQs from custom content, and incorporate it as a tool during the MCQ generation.
- Interactive MCQ Display: Display MCQs in an interactive card format with question, options, answer selection, and explanation.

## Style Guidelines:

- Primary color: Cyan (#00FFFF) to reflect a sense of technology and intelligence.
- Background color: Dark navy blue (#0A0D14), creating a focused and modern learning environment.
- Accent color: Light cyan (#7DF9FF), draws attention to interactive elements.
- Headline font: 'Space Grotesk' sans-serif for a tech-forward, crisp presentation.
- Body font: 'Inter' sans-serif for readability in longer question descriptions and explanations.
- Use minimalist, glowing icons for subject categories and controls, emphasizing interactivity.
- Implement subtle loading animations during MCQ generation and smooth transitions for answer reveals, enhancing user experience.