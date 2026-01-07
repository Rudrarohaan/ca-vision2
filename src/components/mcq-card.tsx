'use client';

import { useState, useEffect } from 'react';
import type { MCQ } from '@/ai/flows/generate-mcqs-from-syllabus';
import { CardContent, CardDescription, CardHeader } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

type McqCardProps = {
  mcq: MCQ;
  onSelectOption: (option: string) => void;
  userAnswer: string | null;
};

export function McqCard({ mcq, onSelectOption, userAnswer }: McqCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(userAnswer);

  useEffect(() => {
    setSelectedOption(userAnswer);
  }, [userAnswer, mcq]);
  
  const handleValueChange = (value: string) => {
    setSelectedOption(value);
    onSelectOption(value);
  }

  return (
    <div className="overflow-hidden transition-all">
      <CardHeader className="pt-0">
        <CardDescription className="text-base pt-2 text-foreground">
          {mcq.question}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOption || ''}
          onValueChange={handleValueChange}
          className="space-y-3"
        >
          {Object.entries(mcq.options).map(([key, value]) => (
            <div key={key}>
              <RadioGroupItem value={key} id={`${mcq.id}-${key}`} className="sr-only" />
              <Label
                htmlFor={`${mcq.id}-${key}`}
                className={cn(
                  'flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all',
                  'border-muted hover:border-primary',
                  'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary',
                   selectedOption === key && 'bg-accent border-primary'
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold">{key}</span>
                  <span>{value}</span>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </div>
  );
}
