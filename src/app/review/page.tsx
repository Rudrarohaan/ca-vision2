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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle2, XCircle } from 'lucide-react';
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
    <div className="container mx-auto max-w-5xl py-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl font-bold">Quiz Results</CardTitle>
          <CardDescription className="text-lg">
            You scored
          </CardDescription>
            <p className="text-5xl font-bold text-primary">{score} / {mcqs.length}</p>
            <p className={`text-xl font-semibold ${scorePercentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                ({scorePercentage.toFixed(1)}%)
            </p>
        </CardHeader>
        <CardContent>
          <h2 className="mb-4 text-center font-headline text-2xl font-bold">
            Review Your Answers
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {mcqs.map((mcq, index) => (
              <AccordionItem value={`item-${index}`} key={mcq.id}>
                <AccordionTrigger className='hover:no-underline'>
                  <div className='flex items-center gap-4 text-left'>
                    {mcq.userAnswer === mcq.correctAnswer ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    ) : (
                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    )}
                    <span className="font-semibold">Question {index + 1}:</span>
                    <span className="truncate">{mcq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ReviewCard mcq={mcq} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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