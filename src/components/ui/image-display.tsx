"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageDisplayProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImageDisplay({ src, alt = "Nova provided image", className = "" }: ImageDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`my-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400 ${className}`}>
        <p>Failed to load image</p>
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline break-all"
        >
          View original link
        </a>
      </div>
    );
  }

  return (
    <div className={`my-3 ${className}`}>
      <a 
        href={src} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 transition-all duration-200 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400"></div>
                <span className="text-sm">Loading image...</span>
              </div>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-w-full transition-transform duration-200 group-hover:scale-[1.02]"
            style={{ maxWidth: '500px', margin: '0 auto', display: 'block' }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 text-center group-hover:text-cyan-400 transition-colors">
          Click to view full size
        </p>
      </a>
    </div>
  );
}

