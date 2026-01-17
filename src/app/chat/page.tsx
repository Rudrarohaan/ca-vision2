'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, File, Loader2, BrainCircuit, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInstantStudyAssistance } from '@/app/actions';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'model';
  content: string; 
  file?: File; 
  id: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const text = input;
    const file = attachedFile;

    if (!text && !file) return;

    setIsLoading(true);
    setInput('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      file: file ?? undefined,
    };
    setMessages(prev => [...prev, userMessage]);

    const formData = new FormData();
    formData.append('question', text);
    if (file) {
      formData.append('file', file);
    }
    
    try {
      const response = await getInstantStudyAssistance(formData);
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.answer,
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };
  
  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              Ask a question, paste a YouTube link, or upload a PDF to get started.
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
                {message.role === 'user' && (
                    <>
                        {message.file && (
                             <div className="flex items-center gap-2 p-2 mb-2 rounded-md bg-black/10">
                                <File className="h-5 w-5 flex-shrink-0" />
                                <span className='truncate'>{message.file.name}</span>
                            </div>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </>
                )}
                {message.role === 'model' && (
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
        {attachedFile && (
            <div className="flex items-center justify-between rounded-md border p-2 mb-2 bg-muted/50">
                <div className="flex items-center gap-2 overflow-hidden">
                    <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{attachedFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="flex-shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <div className="relative">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Ask a question or paste a YouTube link..."
            className="h-12 w-full rounded-full bg-input pr-24 pl-12"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
            onClick={handleSendMessage}
            disabled={isLoading || (!input && !attachedFile)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
