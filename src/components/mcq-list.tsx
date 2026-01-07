'use client';

import { useState } from 'react';
import type { GenerateMcqsFromSyllabusOutput } from '@/ai/flows/generate-mcqs-from-syllabus';
import { McqCard } from './mcq-card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Check, Repeat, Trophy } from 'lucide-react';

type McqListProps = {
  mcqs: GenerateMcqsFromSyllabusOutput;
  onReset: () => void;
};

export function McqList({ mcqs, onReset }: McqListProps) {
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const handleCorrectAnswer = () => {
    setScore((prev) => prev + 1);
    setAnsweredCount((prev) => prev + 1);
  };
  
  const handleIncorrectAnswer = () => {
    setAnsweredCount((prev) => prev + 1);
  };
  
  const allAnswered = answeredCount === mcqs.length;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
          <h1 className="font-headline text-3xl font-bold mb-6">Your Generated Questions</h1>
          <div className="space-y-6">
            {mcqs.map((mcq, index) => (
              <McqCard
                key={mcq.id}
                mcq={mcq}
                questionNumber={index + 1}
                onCorrectAnswer={handleCorrectAnswer}
                onIncorrectAnswer={handleIncorrectAnswer}
              />
            ))}
          </div>
        </div>
        <div className="w-full md:w-72 sticky top-24">
            <Card className="shadow-lg shadow-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="text-primary"/> Your Score
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="text-5xl font-bold">
                        {score} <span className="text-2xl text-muted-foreground">/ {mcqs.length}</span>
                    </div>
                    <p className="text-muted-foreground mt-2">{answeredCount} of {mcqs.length} answered</p>

                    {allAnswered && (
                        <div className="mt-4 p-3 rounded-md bg-accent text-accent-foreground flex flex-col items-center">
                            <Check className="h-8 w-8 text-green-500 mb-2" />
                           <p className="font-semibold">Quiz Complete!</p>
                           <p className="text-sm">Great job finishing the quiz.</p>
                        </div>
                    )}
                    
                    <Button onClick={onReset} className="w-full mt-6">
                        <Repeat className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
