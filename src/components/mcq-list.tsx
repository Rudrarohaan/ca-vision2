'use client';

import { useState } from 'react';
import type {
  GenerateMcqsFromSyllabusOutput,
  MCQ,
} from '@/lib/types';
import { McqCard } from './mcq-card';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from './ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Progress } from './ui/progress';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type McqListProps = {
  mcqs: GenerateMcqsFromSyllabusOutput;
  onReset: () => void;
};

export function McqList({ mcqs: initialMcqs, onReset }: McqListProps) {
  const [mcqs, setMcqs] = useState<(MCQ & { userAnswer?: string | null })[]>(
    initialMcqs.map(mcq => ({ ...mcq, userAnswer: null }))
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleOptionSelect = (option: string) => {
    const newMcqs = [...mcqs];
    newMcqs[currentQuestionIndex].userAnswer = option;
    setMcqs(newMcqs);
  };

  const handleNext = () => {
    if (currentQuestionIndex < mcqs.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const score = mcqs.reduce((acc, mcq) => {
    return mcq.userAnswer === mcq.correctAnswer ? acc + 1 : acc;
  }, 0);

  const handleSubmit = () => {
    // Persist aggregated stats to Firestore client-side
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      updateDoc(userDocRef, {
        totalMcqsAttempted: increment(mcqs.length),
        totalMcqsCorrect: increment(score),
      }).catch(error => {
        console.error('Error updating quiz stats:', error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not save your quiz performance.',
        });
      });
    }

    // Persist quiz state to localStorage for the review page to access
    localStorage.setItem('quizState', JSON.stringify(mcqs));
    setQuizFinished(true);
  };

  const handleReview = () => {
    router.push('/review');
  };


  if (quizFinished) {
    return (
      <div className="container mx-auto flex max-w-5xl items-center justify-center py-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Quiz Complete!
            </CardTitle>
            <CardDescription>You've finished the quiz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-5xl font-bold text-primary">
              {score} / {mcqs.length}
            </p>
            <p className="text-muted-foreground">
              Great job! You can review your answers or start a new quiz.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" onClick={handleReview}>
              Review Answers
            </Button>
            <Button variant="outline" className="w-full" onClick={onReset}>
              Create New Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentMcq = mcqs[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / mcqs.length) * 100;

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl font-bold">
              Your Generated Questions
            </h1>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Question {currentQuestionIndex + 1} of {mcqs.length}
            </p>
          </div>
          <Progress value={progress} className="mt-2 w-full" />
        </CardHeader>
        <CardContent>
          <McqCard
            key={currentMcq.id}
            mcq={currentMcq}
            onSelectOption={handleOptionSelect}
            userAnswer={currentMcq.userAnswer || null}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {currentQuestionIndex === mcqs.length - 1 ? (
            <Button onClick={handleSubmit}>Submit Quiz</Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
