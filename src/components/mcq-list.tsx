'use client';

import { useState } from 'react';
import type { GenerateMcqsFromSyllabusOutput } from '@/ai/flows/generate-mcqs-from-syllabus';
import { McqCard } from './mcq-card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Check, Repeat, Trophy, ArrowLeft, ArrowRight } from 'lucide-react';
import { Progress } from './ui/progress';

type McqListProps = {
  mcqs: GenerateMcqsFromSyllabusOutput;
  onReset: () => void;
};

export function McqList({ mcqs, onReset }: McqListProps) {
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredStatuses, setAnsweredStatuses] = useState<boolean[]>(
    new Array(mcqs.length).fill(false)
  );

  const handleCorrectAnswer = () => {
    if (!answeredStatuses[currentQuestionIndex]) {
      setScore((prev) => prev + 1);
      setAnsweredCount((prev) => prev + 1);
      const newStatuses = [...answeredStatuses];
      newStatuses[currentQuestionIndex] = true;
      setAnsweredStatuses(newStatuses);
    }
  };
  
  const handleIncorrectAnswer = () => {
     if (!answeredStatuses[currentQuestionIndex]) {
      setAnsweredCount((prev) => prev + 1);
      const newStatuses = [...answeredStatuses];
      newStatuses[currentQuestionIndex] = true;
      setAnsweredStatuses(newStatuses);
    }
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
  
  const allAnswered = answeredCount === mcqs.length;
  const currentMcq = mcqs[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / mcqs.length) * 100;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
            <Card>
                <CardHeader>
                    <h1 className="font-headline text-3xl font-bold">Your Generated Questions</h1>
                    <p className="text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {mcqs.length}
                    </p>
                    <Progress value={progress} className="w-full mt-2" />
                </CardHeader>
                <CardContent>
                    <McqCard
                        key={currentMcq.id}
                        mcq={currentMcq}
                        questionNumber={currentQuestionIndex + 1}
                        onCorrectAnswer={handleCorrectAnswer}
                        onIncorrectAnswer={handleIncorrectAnswer}
                    />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    <Button onClick={handleNext} disabled={currentQuestionIndex === mcqs.length - 1}>
                        Next
                        <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
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
                        Generate New Quiz
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
