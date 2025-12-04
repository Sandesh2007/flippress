'use client';

import { Loader2, Sparkles } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  showSparkles?: boolean;
}

export const LoadingSpinner = ({ 
  size = "md", 
  text = "Loading...",
  showSparkles = false 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary/20 border-t-primary`}></div>
        {showSparkles && (
          <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/30"></div>
        )}
      </div>
      {text && (
        <div className="flex items-center gap-2">
          <span className={`${textSizes[size]} text-primary animate-pulse-slow`}>
            {text}
          </span>
          {showSparkles && (
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
};

export const LoadingDots = ({ text = "Loading" }: { text?: string }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{text}</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export const LoadingCard = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-soft p-8 text-center">
        <div className="absolute inset-0 bg-blue-500/5 animate-pulse-slow"></div>
        <div className="relative">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500 shadow-glow animate-bounce-slow">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4 animate-fade-in">
            Processing...
          </h3>
          <p className="text-muted-foreground animate-pulse-slow">
            Please wait while we prepare your content
          </p>
        </div>
      </div>
    </div>
  );
};
