'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { BarChart, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, XAxis, YAxis, Pie, Cell } from 'recharts';


const chartData = [
  { subject: 'Accounting', correct: 8, total: 10 },
  { subject: 'Law', correct: 6, total: 10 },
  { subject: 'Tax', correct: 9, total: 10 },
  { subject: 'Audit', correct: 5, total: 10 },
  { subject: 'FM', correct: 7, total: 10 },
];

const overallAnalytics = {
  totalAttempted: 50,
  overallAccuracy: 70,
  mcqsGenerated: 5,
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          Welcome back, {user?.displayName?.split(' ')[0] || 'CA Aspirant'}!
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              MCQ Generator
            </CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create custom multiple-choice questions from syllabus or uploaded
              materials.
            </CardDescription>
          </CardContent>
          <CardContent>
            <Link href="/mcq-generator">
              <Button>
                Start Generating <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Chatbot</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Ask questions, summarize YouTube videos, and get help with PDFs.
            </CardDescription>
          </CardContent>
          <CardContent>
            <Link href="/chat">
              <Button>
                Start Chatting <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>
              A quick look at your MCQ stats.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg">
                <p className="text-4xl font-bold text-primary">{overallAnalytics.totalAttempted}</p>
                <p className="text-sm text-muted-foreground">Attempted</p>
            </div>
             <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg">
                <p className="text-4xl font-bold text-primary">{overallAnalytics.overallAccuracy}%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="col-span-2 flex flex-col items-center justify-center p-4 bg-secondary rounded-lg">
                <p className="text-4xl font-bold text-primary">{overallAnalytics.mcqsGenerated}</p>
                <p className="text-sm text-muted-foreground">Quizzes Generated</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Subject-wise Accuracy</CardTitle>
            <CardDescription>
              Your accuracy across different subjects.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="w-full h-full">
              <BarChart data={chartData} accessibilityLayer>
                <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="correct" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
