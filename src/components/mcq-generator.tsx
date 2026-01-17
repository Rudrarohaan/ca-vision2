'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyllabusForm } from './syllabus-form';
import { UploadForm } from './upload-form';
import { McqList } from './mcq-list';
import type { GenerateMcqsFromSyllabusOutput } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { incrementQuizzesGeneratedAction } from '@/app/actions';

export function McqGenerator() {
  const [mcqs, setMcqs] = useState<GenerateMcqsFromSyllabusOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const handleReset = () => {
    setMcqs(null);
    setError(null);
  };

  const onMcqsGenerated = (newMcqs: GenerateMcqsFromSyllabusOutput | null) => {
    if (newMcqs && newMcqs.length > 0) {
      setMcqs(newMcqs);
      if (user) {
        incrementQuizzesGeneratedAction({ userId: user.uid });
      }
    } else {
      // This case handles generation failure or empty results
      // The error state will be set within the forms, so we just ensure mcqs is null
      setMcqs(null);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="font-headline text-2xl font-bold">
          Generating MCQs...
        </h2>
        <p className="text-muted-foreground">
          Please wait while our AI assistant crafts your questions.
        </p>
      </div>
    );
  }

  if (mcqs) {
    return <McqList mcqs={mcqs} onReset={handleReset} />;
  }
  
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">
            AI-Powered MCQ Generator
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Create custom multiple-choice questions for your CA exam preparation in seconds.
          </p>
        </div>
        <Card className="shadow-2xl shadow-primary/5">
          <CardContent className="p-0">
            <Tabs defaultValue="syllabus" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none h-14">
                <TabsTrigger value="syllabus" className="h-full rounded-tl-md text-base">From Syllabus</TabsTrigger>
                <TabsTrigger value="upload" className="h-full rounded-tr-md text-base">From Upload</TabsTrigger>
              </TabsList>
              <div className="p-6">
                <TabsContent value="syllabus">
                  <SyllabusForm onMcqsGenerated={onMcqsGenerated} setLoading={setLoading} setError={setError} />
                </TabsContent>
                <TabsContent value="upload">
                  <UploadForm onMcqsGenerated={onMcqsGenerated} setLoading={setLoading} setError={setError} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    