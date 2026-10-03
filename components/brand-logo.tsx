import React from "react";
import Link from "next/link";

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
    <img
      src="/logo.png"
      alt="NumVerge Logo"
      width={size}
      height={size}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}

export function BrandLogo({
  className = "",
  size = "md",
  href = "/",
  showSubtitle = false,
}: BrandLogoProps) {
  const imageSizes = {
    sm: { box: "w-7 h-7 sm:w-8 sm:h-8", text: "text-base sm:text-lg" },
    md: { box: "w-8 h-8 sm:w-9 sm:h-9", text: "text-lg sm:text-xl" },
    lg: { box: "w-10 h-10 sm:w-12 sm:h-12", text: "text-2xl sm:text-3xl font-extrabold" },
  };

  const current = imageSizes[size];

  const content = (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none group min-w-0 ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-md shadow-cyan-500/20 group-hover:border-cyan-400 group-hover:shadow-cyan-500/40 transition-all duration-300 ${current.box}`}>
        <img
          src="/logo.png"
          alt="NumVerge OTP Logo"
          className="w-full h-full object-cover"
        />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300 -z-10" />
      </div>

      <div className="flex flex-col min-w-0">
        <div className={`flex items-center gap-1 font-bold ${current.text} leading-tight`}>
          <span className="text-white tracking-tight">Num</span>
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Verge
          </span>
          <span className="relative inline-flex items-center justify-center p-[1.5px] rounded-md overflow-hidden ml-1.5 neon-otp-glow">
            {/* Moving Neon Light Border */}
            <span className="absolute -inset-[200%] animate-neon-border bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,transparent_50%,#06b6d4_70%,#38bdf8_85%,#ffffff_100%)] pointer-events-none" />
            
            {/* Inner Badge */}
            <span className="relative z-10 px-1.5 py-0.5 rounded-[5px] bg-[#030712] text-[9px] sm:text-[10px] uppercase tracking-wider font-black text-cyan-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
              <span>OTP</span>
            </span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide truncate">
            Instant SMS Verification & Virtual SIMs
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block min-w-0">
        {content}
      </Link>
    );
  }

  return content;
}
