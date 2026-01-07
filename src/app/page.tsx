import { Header } from '@/components/header';
import { McqGenerator } from '@/components/mcq-generator';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col">
        <McqGenerator />
      </main>
    </div>
  );
}
