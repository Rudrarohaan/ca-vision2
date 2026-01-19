'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInstantStudyAssistance } from '@/app/actions';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'model';
  content: string; 
  id: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setIsLoading(true);
    setInput('');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMessage]);
    
    const response = await getInstantStudyAssistance({ question: text });

    if (response.error) {
      console.error(response.error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `An error occurred: ${response.error}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } else if (response.data) {
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.data.answer,
      };
      setMessages(prev => [...prev, modelMessage]);
    } else {
       const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
             <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 glow-soft">
                <BrainCircuit className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-headline text-3xl font-bold">CA Study Assistant</h2>
            <p className="max-w-md text-muted-foreground mt-2">
              Ask any CA-related question to get started.
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-4',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'model' && (
                <Avatar className="h-8 w-8 border flex-shrink-0">
                  <AvatarFallback className='bg-primary text-primary-foreground'>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-prose rounded-xl px-4 py-3 shadow-sm prose dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-li:my-1',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground'
                    : 'bg-card'
                )}
              >
                {message.role === 'user' ? (
                   <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 border flex-shrink-0">
                   <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
         {isLoading && (
            <div className="flex items-start gap-4 justify-start">
                 <Avatar className="h-8 w-8 border flex-shrink-0">
                  <AvatarFallback className='bg-primary text-primary-foreground'>AI</AvatarFallback>
                </Avatar>
                <div className="max-w-lg rounded-xl px-4 py-3 shadow-sm bg-card flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin"/>
                    Thinking...
                </div>
            </div>
        )}
      </div>
      <div className="border-t bg-background p-4">
        <div className="relative">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Ask a question..."
            className="h-12 w-full rounded-full bg-input pr-14 pl-5"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
