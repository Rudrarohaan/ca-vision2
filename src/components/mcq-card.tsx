'use client';

import { useState } from 'react';
import type { MCQ } from '@/ai/flows/generate-mcqs-from-syllabus';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { CheckCircle, Info, ThumbsUp, XCircle } from 'lucide-react';

type McqCardProps = {
  mcq: MCQ;
  questionNumber: number;
  onCorrectAnswer: () => void;
  onIncorrectAnswer: () => void;
};

export function McqCard({ mcq, questionNumber, onCorrectAnswer, onIncorrectAnswer }: McqCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const isCorrect = selectedOption === mcq.correctAnswer;

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === mcq.correctAnswer) {
      onCorrectAnswer();
    } else {
      onIncorrectAnswer();
    }
  };

  const getOptionClassName = (option: string) => {
    if (!isAnswered) {
        return 'border-muted hover:border-primary';
    }
    if (option === mcq.correctAnswer) {
        return 'border-green-500 bg-green-500/10';
    }
    if (option === selectedOption && option !== mcq.correctAnswer) {
        return 'border-red-500 bg-red-500/10';
    }
    return 'border-muted';
  };
  
  const getOptionIndicator = (option: string) => {
    if (!isAnswered) return null;
    if (option === mcq.correctAnswer) {
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (option === selectedOption && option !== mcq.correctAnswer) {
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return null;
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-xl">
          Question {questionNumber}
        </CardTitle>
        <CardDescription className="text-base pt-2 text-foreground">
          {mcq.question}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOption || ''}
          onValueChange={setSelectedOption}
          disabled={isAnswered}
          className="space-y-3"
        >
          {Object.entries(mcq.options).map(([key, value]) => (
            <div key={key}>
              <RadioGroupItem value={key} id={`${mcq.id}-${key}`} className="sr-only" />
              <Label
                htmlFor={`${mcq.id}-${key}`}
                className={cn(
                  'flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all',
                  getOptionClassName(key),
                  !isAnswered && 'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary',
                  isAnswered && 'cursor-not-allowed',
                  selectedOption === key && 'bg-accent'
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold">{key}</span>
                  <span>{value}</span>
                </div>
                {getOptionIndicator(key)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        {!isAnswered && (
          <Button onClick={handleSubmit} disabled={!selectedOption}>
            Check Answer
          </Button>
        )}
        {isAnswered && (
          <Alert variant={isCorrect ? 'default' : 'destructive'} className={cn(isCorrect ? 'bg-green-500/10 border-green-500/50' : '')}>
            {isCorrect ? <ThumbsUp className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            <AlertTitle>{isCorrect ? 'Correct!' : 'Incorrect'}</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
                <p>{mcq.explanation}</p>
                <p className="font-semibold">Correct Answer: {mcq.correctAnswer}. {mcq.options[mcq.correctAnswer as keyof typeof mcq.options]}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
