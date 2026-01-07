'use client';

import { useState } from 'react';
import type { GenerateMcqsFromSyllabusOutput, MCQ } from '@/ai/flows/generate-mcqs-from-syllabus';
import { McqCard } from './mcq-card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from './ui/card';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

type McqListProps = {
  mcqs: GenerateMcqsFromSyllabusOutput;
  onReset: () => void;
};

export function McqList({ mcqs: initialMcqs, onReset }: McqListProps) {
  const [mcqs, setMcqs] = useState<(MCQ & { userAnswer?: string | null; flagged?: boolean })[]>(initialMcqs.map(mcq => ({...mcq, flagged: false})));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleOptionSelect = (option: string) => {
    const newMcqs = [...mcqs];
    newMcqs[currentQuestionIndex].userAnswer = option;
    setMcqs(newMcqs);
  };

  const toggleFlag = (index: number) => {
    const newMcqs = [...mcqs];
    newMcqs[index].flagged = !newMcqs[index].flagged;
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
    <div className="container mx-auto max-w-6xl py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                      <h1 className="font-headline text-3xl font-bold">Your Generated Questions</h1>
                      <Button onClick={onReset} variant="outline" size="sm">
                          New Quiz
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">
                          Question {currentQuestionIndex + 1} of {mcqs.length}
                      </p>
                      <Button onClick={() => toggleFlag(currentQuestionIndex)} variant="ghost" size="sm" className={cn(currentMcq.flagged && 'text-primary')}>
                          <Flag className="mr-2 h-4 w-4" />
                          {currentMcq.flagged ? 'Flagged' : 'Flag for Review'}
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

        <aside className="w-full md:w-64">
          <Card>
            <CardHeader>
              <CardTitle>Question Palette</CardTitle>
              <CardDescription>Click to jump to a question.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="grid grid-cols-5 gap-2">
                  {mcqs.map((mcq, index) => (
                    <Button
                      key={mcq.id}
                      variant={
                        currentQuestionIndex === index
                          ? 'default'
                          : mcq.userAnswer
                          ? 'secondary'
                          : 'outline'
                      }
                      className={cn(
                        'relative h-10 w-10 p-0',
                        mcq.flagged && 'ring-2 ring-primary ring-offset-2'
                      )}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                      {mcq.flagged && <Flag className="absolute top-0 right-0 h-3 w-3 -mt-1 -mr-1 text-primary fill-primary" />}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
