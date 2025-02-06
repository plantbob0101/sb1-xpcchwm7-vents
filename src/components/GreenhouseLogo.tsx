import React from 'react';

interface GreenhouseLogoProps {
  className?: string;
}

export function GreenhouseLogo({ className = "h-6 w-6" }: GreenhouseLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Modern minimalist greenhouse */}
      <path d="M6 18h12V8H6v10" />
      <path d="M6 8l6-5 6 5" />
    </svg>
  );
}