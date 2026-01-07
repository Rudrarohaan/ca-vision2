'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewCard } from '@/components/review-card';
import { useState, useEffect } from 'react';
import type { MCQ } from '@/ai/flows/generate-mcqs-from-syllabus';

// Mocked quiz data for standalone development. In a real app, this would come from a context or state management.
const mockMcqs: (MCQ & { userAnswer: string | null })[] = [
    {
        id: 1,
        question: "This is a mock question. If you are seeing this, it means the quiz state was not available. Please start a new quiz.",
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
        correctAnswer: 'A',
        explanation: 'This is a mock explanation.',
        userAnswer: 'B'
    }
];

export default function ReviewPage() {
  const router = useRouter();
  const [mcqs, setMcqs] = useState<(MCQ & { userAnswer: string | null })[]>([]);
  
  useEffect(() => {
    const storedMcqs = localStorage.getItem('quizState');
    if (storedMcqs) {
      const parsedMcqs = JSON.parse(storedMcqs);
      // Ensure userAnswer is part of the state
      const mcqsWithAnswers = parsedMcqs.map((mcq: MCQ & {userAnswer?: string | null}) => ({
        ...mcq,
        userAnswer: mcq.userAnswer || null,
      }));
      setMcqs(mcqsWithAnswers);
    } else {
      setMcqs(mockMcqs);
    }
  }, []);

  const handleNewQuiz = () => {
    localStorage.removeItem('quizState');
    router.push('/');
  };

  const score = mcqs.reduce((acc, mcq) => {
    return mcq.userAnswer === mcq.correctAnswer ? acc + 1 : acc;
  }, 0);
  
  const scorePercentage = mcqs.length > 0 ? (score / mcqs.length) * 100 : 0;

  if (mcqs.length === 0 || (mcqs.length > 0 && !mcqs[0].userAnswer && mcqs[0].id === 1)) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
             <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">No Quiz Data Found</CardTitle>
                    <CardDescription>Please start a new quiz to review your answers.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button className="w-full" onClick={handleNewQuiz}>Start New Quiz</Button>
                </CardFooter>
            </Card>
        </div>
     )
  }


  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="font-headline text-4xl font-bold">Quiz Review</CardTitle>
          <CardDescription className="text-xl">
            Your final score: <span className="font-bold text-primary">{score} / {mcqs.length}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {mcqs.map((mcq, index) => (
              <ReviewCard key={mcq.id} mcq={mcq} questionNumber={index + 1} />
          ))}
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg" onClick={handleNewQuiz}>
            Start New Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
