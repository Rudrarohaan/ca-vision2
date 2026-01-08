'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Youtube, File, Loader2, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatAction } from '@/app/actions';

type Message = {
  role: 'user' | 'model';
  content: { text?: string; media?: { url: string; contentType?: string } }[];
  id: string;
};

const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([\w-]{11})/;


const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSendMessage = async (
    text: string,
    file?: File
  ) => {
    if (!text && !file) return;

    setIsLoading(true);

    const userMessageContent: Message['content'] = [];

    if (text) {
      userMessageContent.push({ text });
    }
    if (file) {
        const fileDataUri = await fileToDataUri(file);
        userMessageContent.push({ media: { url: fileDataUri, contentType: file.type } });
    }

    const newUserMessage: Message = {
      role: 'user',
      content: userMessageContent,
      id: Date.now().toString(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');

    try {
      const history = [...messages, newUserMessage].map(
        ({ role, content }) => ({ role, content })
      );

      const response = await chatAction({ history });
      
      const modelMessage: Message = {
        role: 'model',
        content: [{ text: response.content }],
        id: (Date.now() + 1).toString(),
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: 'model',
        content: [{ text: 'Sorry, something went wrong. Please try again.' }],
        id: (Date.now() + 1).toString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendMessage(input, file);
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
            <h2 className="font-headline text-3xl font-bold">CA Chat Assistant</h2>
            <p className="max-w-md text-muted-foreground mt-2">
              Ask me anything about CA topics, drop a YouTube link to summarize, or upload a PDF to ask questions.
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
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className='bg-primary text-primary-foreground'>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-lg rounded-xl px-4 py-3 shadow-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                )}
              >
                {message.content.map((part, index) => {
                  if (part.text) {
                    const isYoutubeLink = YOUTUBE_REGEX.test(part.text);
                    if (isYoutubeLink) {
                        return (
                            <div key={index} className="flex items-center gap-2">
                                <Youtube className="h-5 w-5 text-red-500" />
                                <span>Summarizing video...</span>
                            </div>
                        )
                    }
                    return <p key={index} className="whitespace-pre-wrap">{part.text}</p>;
                  }
                  if (part.media) {
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <File className="h-5 w-5" />
                            <span>Ready to answer questions about this file.</span>
                        </div>
                    )
                  }
                  return null;
                })}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 border">
                   <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
         {isLoading && (
            <div className="flex items-start gap-4 justify-start">
                 <Avatar className="h-8 w-8 border">
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
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage(input)}
            placeholder="Ask about a CA topic or paste a YouTube link..."
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
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || (!input && !fileInputRef.current?.files?.length)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
