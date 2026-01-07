import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 glow-soft">
            <BrainCircuit className="h-6 w-6 text-primary" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight">
            CA Exam Prep
          </span>
        </Link>
        <nav>
          <Link href="/login">
            <Button variant="outline" className="transition-all hover:bg-accent/50 hover:text-accent-foreground">
              Login
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
