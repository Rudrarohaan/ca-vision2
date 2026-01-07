'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { generateMcqsFromUploadedMaterialAction } from '@/app/actions';
import type { GenerateMcqsFromUploadedMaterialOutput } from '@/ai/flows/generate-mcqs-from-uploaded-material';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, UploadCloud, File, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const formSchema = z.object({
  file: z
    .any()
    .refine((file) => file, 'File is required.')
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
      '.pdf, .docx, and .txt files are accepted.'
    ),
  subject: z.string().min(1, 'Please enter a subject.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  count: z.number().min(5).max(50),
});

type UploadFormProps = {
  setMcqs: (mcqs: GenerateMcqsFromUploadedMaterialOutput | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export function UploadForm({ setMcqs, setLoading, setError }: UploadFormProps) {
  const { toast } = useToast();
  const [count, setCount] = useState(10);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      difficulty: 'Medium',
      count: 10,
      subject: '',
    },
  });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      form.setValue('file', file, { shouldValidate: true });
    }
  };
  
  const removeFile = () => {
    setFile(null);
    form.setValue('file', null, { shouldValidate: true });
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    try {
      const fileDataUri = await fileToDataUri(values.file);
      const result = await generateMcqsFromUploadedMaterialAction({ ...values, fileDataUri, level: 'Intermediate' });
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
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Upload Material</FormLabel>
              {file ? (
                <div className="flex items-center justify-between rounded-md border border-dashed p-4">
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <FormControl>
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT (MAX. 5MB)</p>
                    </div>
                    <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.join(',')} />
                  </label>
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Indian Contract Act, 1872" {...field} />
              </FormControl>
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
                        <RadioGroupItem value="Easy" id="upload-difficulty-easy" className="sr-only" />
                        <Label htmlFor="upload-difficulty-easy" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
                        Easy
                        </Label>
                    </FormItem>
                    <FormItem>
                        <RadioGroupItem value="Medium" id="upload-difficulty-medium" className="sr-only" />
                        <Label htmlFor="upload-difficulty-medium" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
                        Medium
                        </Label>
                    </FormItem>
                    <FormItem>
                        <RadioGroupItem value="Hard" id="upload-difficulty-hard" className="sr-only" />
                        <Label htmlFor="upload-difficulty-hard" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary cursor-pointer text-sm">
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

        <Button type="submit" size="lg" className="w-full text-lg font-bold glow-primary transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none" disabled={!form.formState.isValid}>
          Generate MCQs <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>
    </Form>
  );
}
