"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ children, className, glow }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl",
        glow && "shadow-violet-500/10 ring-1 ring-violet-500/20",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        active ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
      )}
    />
  );
}
