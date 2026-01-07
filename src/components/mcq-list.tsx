'use client';

import { useState } from 'react';
import type { GenerateMcqsFromSyllabusOutput, MCQ } from '@/ai/flows/generate-mcqs-from-syllabus';
import { McqCard } from './mcq-card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardFooter } from './ui/card';
import { Repeat, ArrowLeft, ArrowRight } from 'lucide-react';
import { Progress } from './ui/progress';

type McqListProps = {
  mcqs: GenerateMcqsFromSyllabusOutput;
  onReset: () => void;
};

export function McqList({ mcqs: initialMcqs, onReset }: McqListProps) {
  const [mcqs, setMcqs] = useState<(MCQ & { userAnswer?: string | null })[]>(initialMcqs);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  const handleSubmit = () => {
    // Here you would typically navigate to a review page and pass the mcqs state.
    // For now, we'll just log it and reset.
    console.log('Quiz submitted!', mcqs);
    alert('Quiz submitted! Check the console for your answers. A review page would be shown here.');
    onReset();
  };
  
  const currentMcq = mcqs[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / mcqs.length) * 100;
  const allAnswered = mcqs.every(mcq => mcq.userAnswer);


  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
            <Card>
                <CardHeader>
                    <h1 className="font-headline text-3xl font-bold">Your Generated Questions</h1>
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">
                          Question {currentQuestionIndex + 1} of {mcqs.length}
                      </p>
                      <Button onClick={onReset} variant="outline" size="sm">
                          <Repeat className="mr-2 h-4 w-4" />
                          New Quiz
                      </Button>
                    </div>
                    <Progress value={progress} className="w-full mt-2" />
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
                    <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    {currentQuestionIndex === mcqs.length - 1 ? (
                        <Button onClick={handleSubmit} disabled={!allAnswered}>
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
