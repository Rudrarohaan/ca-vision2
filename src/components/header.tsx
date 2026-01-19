'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon } from 'lucide-react';
import { MainNav } from './main-nav';
import { useUser } from '@/firebase/auth/use-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { CaVisionLogo } from './ca-vision-logo';

function UserNav() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = getAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button
          variant="outline"
          className="transition-all hover:bg-accent/50 hover:text-accent-foreground"
        >
          Login
        </Button>
      </Link>
    );
  }

  const displayName = userProfile?.displayName || user.displayName;
  const photoURL = userProfile?.photoURL || user.photoURL;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    if (name.length > 0) {
        return name[0].toUpperCase();
    }
    return 'U';
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={photoURL || undefined} alt={displayName || 'User'} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || 'No email'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 mr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 glow-soft">
            <CaVisionLogo className="h-6 w-6 text-primary" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight">
            CA Vision 2.0
          </span>
        </Link>
        <MainNav />
        <nav className="flex flex-1 justify-end">
          <UserNav />
        </nav>
      </div>
    </header>
  );
}
