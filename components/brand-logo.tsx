import React from "react";
import Link from "next/link";
import { ShieldCheck, Zap } from "lucide-react";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  showSubtitle?: boolean;
  adminVariant?: boolean;
  subtitle?: string;
}

export function SimChipIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="simGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="chipGrad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* SIM Card outline with notch */}
      <path
        d="M6 4C4.89543 4 4 4.89543 4 6V30C4 31.1046 4.89543 32 6 32H30C31.1046 32 32 31.1046 32 30V12L24 4H6Z"
        fill="#090d16"
        stroke="url(#simGrad)"
        strokeWidth="2"
      />
      {/* Golden/Cyan Chip lines */}
      <rect x="9" y="11" width="18" height="15" rx="3" fill="#0f172a" stroke="url(#chipGrad)" strokeWidth="1.5" />
      <line x1="9" y1="18.5" x2="27" y2="18.5" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="11" x2="18" y2="26" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="18" cy="18.5" r="2.5" fill="#06b6d4" />
      {/* Signal dot */}
      <circle cx="28" cy="8" r="2" fill="#22c55e" />
    </svg>
  );
}

export function BrandLogo({
  className = "",
  size = "md",
  href = "/",
  showSubtitle = false,
}: BrandLogoProps) {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 42,
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl font-extrabold tracking-tight",
  };

  const content = (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      <div className="relative flex items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400/60 group-hover:shadow-cyan-500/25 transition-all duration-300">
        <SimChipIcon size={iconSizes[size]} />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300 -z-10" />
      </div>

      <div className="flex flex-col">
        <div className={`flex items-center gap-1.5 font-bold ${textSizes[size]}`}>
          <span className="text-white tracking-tight">Num</span>
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Verge
          </span>
          <span className="ml-1 text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            OTP
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
            Instant SMS Verification & Virtual SIMs
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
