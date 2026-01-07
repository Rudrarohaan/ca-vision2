'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { caExams, type Level, type Group } from '@/lib/subjects';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { generateMcqsFromSyllabusAction } from '@/app/actions';
import type { GenerateMcqsFromSyllabusOutput } from '@/ai/flows/generate-mcqs-from-syllabus';
import { useToast } from '@/hooks/use-toast';
import { BookCheck, Brain, HardHat, GraduationCap, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  level: z.enum(['Foundation', 'Intermediate', 'Final']),
  group: z.enum(['Group I', 'Group II']).optional(),
  subject: z.string().min(1, 'Please select a subject.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  count: z.number().min(5).max(50),
});

type SyllabusFormProps = {
  setMcqs: (mcqs: GenerateMcqsFromSyllabusOutput | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export function SyllabusForm({ setMcqs, setLoading, setError }: SyllabusFormProps) {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<{name: string, value: string}[]>([]);
  const [count, setCount] = useState(10);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: 'Foundation',
      difficulty: 'Medium',
      count: 10,
    },
  });

  const level = form.watch('level');
  const group = form.watch('group');

  useEffect(() => {
    if (level) {
      if (level === 'Foundation') {
        setSubjects(caExams.Foundation.papers);
        form.setValue('subject', '');
        form.setValue('group', undefined);
      } else {
        if(group) {
          setSubjects(caExams[level][group as Group].papers);
          form.setValue('subject', '');
        } else {
          setSubjects([]);
          form.setValue('subject', '');
        }
      }
    }
  }, [level, group, form]);
  
  useEffect(() => {
     if (level && level !== 'Foundation' && !group) {
        form.setValue('group', 'Group I');
     }
  }, [level, group, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMcqsFromSyllabusAction(values);
      if (result && result.length > 0) {
        setMcqs(result);
      } else {
        throw new Error('No MCQs were generated. Please try again.');
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        title: 'Error Generating MCQs',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">Exam Level</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-3 gap-4"
                >
                  <FormItem>
                    <RadioGroupItem value="Foundation" id="level-foundation" className="sr-only" />
                    <Label htmlFor="level-foundation" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <GraduationCap className="mb-3 h-6 w-6" />
                      Foundation
                    </Label>
                  </FormItem>
                  <FormItem>
                    <RadioGroupItem value="Intermediate" id="level-intermediate" className="sr-only" />
                    <Label htmlFor="level-intermediate" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <BookCheck className="mb-3 h-6 w-6" />
                      Intermediate
                    </Label>
                  </FormItem>
                  <FormItem>
                    <RadioGroupItem value="Final" id="level-final" className="sr-only" />
                    <Label htmlFor="level-final" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <Brain className="mb-3 h-6 w-6" />
                      Final
                    </Label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {level !== 'Foundation' && (
          <FormField
            control={form.control}
            name="group"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">Group</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    <FormItem>
                      <RadioGroupItem value="Group I" id="group-i" className="sr-only" />
                      <Label htmlFor="group-i" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        Group I
                      </Label>
                    </FormItem>
                    <FormItem>
                      <RadioGroupItem value="Group II" id="group-ii" className="sr-only" />
                      <Label htmlFor="group-ii" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        Group II
                      </Label>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Subject</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={subjects.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">Difficulty</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-2"
                    >
                    <FormItem>
                        <RadioGroupItem value="Easy" id="difficulty-easy" className="sr-only" />
                        <Label htmlFor="difficulty-easy" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
                        Easy
                        </Label>
                    </FormItem>
                    <FormItem>
                        <RadioGroupItem value="Medium" id="difficulty-medium" className="sr-only" />
                        <Label htmlFor="difficulty-medium" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
                        Medium
                        </Label>
                    </FormItem>
                    <FormItem>
                        <RadioGroupItem value="Hard" id="difficulty-hard" className="sr-only" />
                        <Label htmlFor="difficulty-hard" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
                        Hard
                        </Label>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <Controller
                control={form.control}
                name="count"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-lg font-semibold">Number of Questions: <span className="text-primary font-bold">{count}</span></FormLabel>
                        <FormControl>
                            <Slider
                                defaultValue={[10]}
                                min={5}
                                max={50}
                                step={1}
                                onValueChange={(value) => {
                                    field.onChange(value[0]);
                                    setCount(value[0]);
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <Button type="submit" size="lg" className="w-full text-lg font-bold glow-primary transition-transform hover:scale-105">
          Generate MCQs <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>
    </Form>
  );
}
