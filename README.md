# CA Exam Prep Platform

This is a Next.js application built with Firebase and Genkit for CA (Chartered Accountancy) exam preparation. It leverages AI to provide students with powerful study tools.

## Features

*   **AI-Powered MCQ Generator**:
    *   Generate custom multiple-choice questions from the official CA syllabus.
    *   Upload your own study materials (PDF, DOCX, TXT) to create questions from specific content.
    *   Customize difficulty (Easy, Medium, Hard) and number of questions.
*   **AI Study Assistant**:
    *   An interactive chatbot to answer any CA-related questions.
    *   Get summaries of YouTube video lectures by simply pasting a link.
    *   Upload and ask questions about PDF documents.
*   **User Profiles & Progress Tracking**:
    *   Personalized user profiles with progress stats.
    *   Track the number of quizzes generated, questions attempted, and overall accuracy.
*   **Real-time & Secure**:
    *   Built on Firebase for real-time data synchronization and a secure backend.
    *   Firestore security rules ensure user data like chat history and uploaded files remain private.

## Tech Stack

*   **Frontend**: Next.js, React, TypeScript, ShadCN UI, Tailwind CSS
*   **Backend**: Firebase (Authentication, Firestore, Storage)
*   **AI**: Google AI (Gemini), Genkit

## Getting Started

To get started, run the development server:

```bash
npm run dev
```

Then, open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The main application logic can be found in `src/app/`.
