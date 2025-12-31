"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_1 = "/assets/ads/ad-video-1.mp4";
const VIDEO_2 = "/assets/ads/ad-video-2.mp4";
const STORAGE_KEY = "deficalc-last-video";
const TARGET_URL = "https://www.stohntrade.com/";

export function CustomVideoAd() {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Get the last shown video from localStorage
    const lastVideo = localStorage.getItem(STORAGE_KEY);
    
    // Alternate to the other video
    const nextVideo = lastVideo === VIDEO_1 ? VIDEO_2 : VIDEO_1;
    
    // Store the choice
    localStorage.setItem(STORAGE_KEY, nextVideo);
    
    // Set the video source
    setVideoSrc(nextVideo);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) {
      return;
    }

    const handleCanPlay = () => {
      setIsLoading(false);
      video.play().catch(() => {
        // Autoplay may fail, but that's ok
      });
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [videoSrc]);

  const handleClick = () => {
    window.open(TARGET_URL, "_blank", "noopener,noreferrer");
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the link
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!videoSrc) {
    return null;
  }

  if (hasError) {
    return (
      <div className="pt-2">
        <div 
          className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-4 cursor-pointer hover:bg-slate-900/80 transition"
          onClick={handleClick}
          role="link"
          tabIndex={0}
        >
          <p className="text-sm text-slate-400">Click to visit StohnTrade</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="pt-2 cursor-pointer group"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-mint" />
          </div>
        )}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-lg transition-opacity group-hover:opacity-90"
          style={{ minHeight: 90 }}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 p-2 backdrop-blur-sm transition-all hover:bg-slate-900/95 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-slate-300">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
              <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-slate-300">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
