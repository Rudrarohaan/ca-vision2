import { cn } from '@/lib/utils';

export function CaVisionLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <path
        d="M9.5 4H7.5C5.567 4 4 5.567 4 7.5V16.5C4 18.433 5.567 20 7.5 20H9.5V18H7.5C6.67157 18 6 17.3284 6 16.5V7.5C6 6.67157 6.67157 6 7.5 6H9.5V4Z"
        fill="currentColor"
      />
      <path
        d="M16.5 4H14.5V6H16.5C17.3284 6 18 6.67157 18 7.5V16.5C18 17.3284 17.3284 18 16.5 18H14.5V20H16.5C18.433 20 20 18.433 20 16.5V7.5C20 5.567 18.433 4 16.5 4Z"
        fill="currentColor"
      />
      {/* Head */}
      <circle cx="12" cy="9" r="2" fill="currentColor" />
      {/* Body */}
      <circle cx="12" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}
