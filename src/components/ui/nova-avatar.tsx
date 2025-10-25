"use client";

import Image from "next/image";

interface NovaAvatarProps {
  isLoading?: boolean;
  className?: string;
}

export function NovaAvatar({ isLoading = false, className = "" }: NovaAvatarProps) {
  if (isLoading) {
    return (
      <div className={`mt-1 p-0.5 ${className}`}>
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-mint/20">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-spin opacity-90" style={{ animationDuration: '2s' }}></div>
          <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 overflow-hidden">
            <Image
              src="/assets/nova-avatar.png"
              alt="Nova Assistant"
              width={32}
              height={32}
              className="h-full w-full object-cover scale-110"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 shrink-0 overflow-hidden ${className}`}>
      <Image
        src="/assets/nova-avatar.png"
        alt="Nova Assistant"
        width={32}
        height={32}
        className="h-full w-full object-cover scale-110 transition-transform duration-200 hover:scale-125"
      />
    </div>
  );
}
