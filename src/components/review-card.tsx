'use client';

import type { MCQ } from '@/ai/flows/generate-mcqs-from-syllabus';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';


type ReviewCardProps = {
  mcq: MCQ & { userAnswer?: string | null };
  questionNumber: number;
};

export function ReviewCard({ mcq, questionNumber }: ReviewCardProps) {
  const { question, options, correctAnswer, explanation, userAnswer } = mcq;
  
  const getOptionClassName = (optionKey: string) => {
    const isCorrect = optionKey === correctAnswer;
    const isUserAnswer = optionKey === userAnswer;

    if (isCorrect) {
      return 'border-green-500 bg-green-500/10 text-foreground';
    }
    if (isUserAnswer && !isCorrect) {
      return 'border-red-500 bg-red-500/10 text-foreground';
    }
    return 'border-muted';
  };
  
  const getIcon = (optionKey: string) => {
    const isCorrect = optionKey === correctAnswer;
    const isUserAnswer = optionKey === userAnswer;
    
    if(isCorrect) {
        return <Check className="h-5 w-5 text-green-500 flex-shrink-0" />;
    }
    if (isUserAnswer && !isCorrect) {
        return <X className="h-5 w-5 text-red-500 flex-shrink-0" />;
    }
    return null;
  }

  return (
    <div className="space-y-6 rounded-lg">
      <p className="text-lg font-semibold text-foreground">{questionNumber}. {question}</p>
      
      <div className="space-y-3">
        {Object.entries(options).map(([key, value]) => (
          <div key={key} className={cn('flex items-center gap-4 rounded-lg border-2 p-4', getOptionClassName(key))}>
             {getIcon(key) ? (
                <div className="w-5">{getIcon(key)}</div>
             ) : (
                <div className="w-5" /> // Placeholder for alignment
             )}
             <span>{value}</span>
          </div>
        ))}
      </div>
      
      {explanation && (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="explanation" className="border-b-0">
                <AccordionTrigger className="text-primary hover:no-underline font-semibold py-0">
                    View Explanation
                </AccordionTrigger>
                <AccordionContent className="pt-2 text-muted-foreground">
                    {explanation}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
