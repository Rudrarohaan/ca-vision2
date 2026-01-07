'use client';

import type { MCQ } from '@/ai/flows/generate-mcqs-from-syllabus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

type ReviewCardProps = {
  mcq: MCQ & { userAnswer?: string | null };
};

export function ReviewCard({ mcq }: ReviewCardProps) {
  const { question, options, correctAnswer, explanation, userAnswer } = mcq;
  
  const getOptionClassName = (optionKey: string) => {
    const isCorrect = optionKey === correctAnswer;
    const isUserAnswer = optionKey === userAnswer;

    if (isCorrect) {
      return 'border-green-500 bg-green-500/10 text-green-500';
    }
    if (isUserAnswer && !isCorrect) {
      return 'border-red-500 bg-red-500/10 text-red-500';
    }
    return 'border-muted';
  };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <p className="text-lg font-semibold text-foreground">{question}</p>
      
      <div className="space-y-3">
        {Object.entries(options).map(([key, value]) => (
          <div key={key} className={cn('flex items-center gap-4 rounded-lg border-2 p-4', getOptionClassName(key))}>
             <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold">{key}</span>
             <span>{value}</span>
          </div>
        ))}
      </div>
      
      <Card className="bg-background/50">
        <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
                {userAnswer === correctAnswer ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                )}
                Explanation
            </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{explanation}</p>
          {!userAnswer && (
             <div className="mt-4 flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                <p>You did not answer this question.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
