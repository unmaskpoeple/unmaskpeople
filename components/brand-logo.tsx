import React from "react";
import Link from "next/link";
import Image from "next/image";

interface UnmaskFaceIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Modern vector icon: A face unmasking himself.
 * Features a glowing revealed human face and a cyber mask being pulled away by hand.
 */
export function UnmaskFaceIcon({ size = 28, className = "", ...props }: UnmaskFaceIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Glow filter */}
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Revealed Face Gradient */}
        <linearGradient id="faceGradient" x1="45" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Mask Gradient */}
        <linearGradient id="maskGradient" x1="15" y1="15" x2="60" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="40%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>

        {/* Hand Gradient */}
        <linearGradient id="handGradient" x1="10" y1="40" x2="45" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* Accent Edge Glow */}
        <linearGradient id="accentGlow" x1="30" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* ─────────────────────────────────────────────────────────────
          1. REVEALED HUMAN FACE (Glowing on the right)
      ────────────────────────────────────────────────────────────── */}
      <g filter="url(#cyanGlow)">
        {/* Human Face Contour (Right Side / Cheek / Jaw / Chin) */}
        <path
          d="M 52,22 C 68,23 80,35 82,50 C 83,63 77,75 68,83 C 60,90 51,93 47,93 C 48,87 49,81 50,75 C 57,70 63,62 64,52 C 64,38 58,28 52,22 Z"
          fill="url(#faceGradient)"
          opacity="0.25"
        />
        <path
          d="M 52,22 C 68,23 80,35 82,50 C 83,63 77,75 68,83 C 60,90 51,93 47,93"
          stroke="url(#faceGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Revealed Human Eye */}
        <path
          d="M 60,46 C 63,42 71,42 74,47 C 71,51 63,51 60,46 Z"
          fill="#38bdf8"
          stroke="#e0f2fe"
          strokeWidth="1.2"
        />
        {/* Pupil with bright cyan core */}
        <circle cx="67" cy="46.5" r="2.2" fill="#ffffff" />

        {/* Eyebrow */}
        <path
          d="M 59,40 Q 66,36 74,40"
          stroke="#38bdf8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Nose bridge & subtle smile contour */}
        <path
          d="M 57,51 Q 61,56 59,62"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M 58,70 Q 64,72 67,69"
          stroke="#38bdf8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* Energy / Data lines radiating from the reveal gap */}
      <path
        d="M 50,30 L 46,28 M 53,42 L 49,42 M 54,58 L 48,60 M 52,72 L 46,75"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* ─────────────────────────────────────────────────────────────
          2. THE MASK BEING PEELLED AWAY (Shifted & tilted to the left)
      ────────────────────────────────────────────────────────────── */}
      <g transform="rotate(-7 36 50)">
        {/* Mask Base Plate */}
        <path
          d="M 36,18 C 48,18 56,26 58,40 C 60,54 53,68 45,74 C 38,79 30,80 25,78 C 21,72 19,62 19,48 C 19,32 25,20 36,18 Z"
          fill="url(#maskGradient)"
          stroke="#c084fc"
          strokeWidth="2.5"
        />

        {/* Cyber Circuit Lines on the Mask */}
        <path
          d="M 32,25 L 42,32 L 42,42 M 25,48 L 30,48 L 35,55 L 44,55"
          stroke="#e9d5ff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        <circle cx="42" cy="42" r="1.5" fill="#f43f5e" />
        <circle cx="25" cy="48" r="1.5" fill="#38bdf8" />

        {/* Mask Eyehole (Hollow Cutout) */}
        <path
          d="M 31,39 C 35,34 43,34 47,40 C 43,45 35,45 31,39 Z"
          fill="#090d16"
          stroke="#c084fc"
          strokeWidth="1.6"
        />
        {/* Empty eyehole interior depth */}
        <path
          d="M 33,39 Q 39,36 45,40"
          stroke="#6366f1"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* ─────────────────────────────────────────────────────────────
          3. THE HAND UNMASKING (Fingers lifting the edge of the mask)
      ────────────────────────────────────────────────────────────── */}
      <g>
        {/* Wrist & Palm Base */}
        <path
          d="M 23,94 C 23,84 25,78 28,72 L 31,68"
          stroke="url(#handGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Index Finger grasping the outer mask edge */}
        <path
          d="M 28,72 C 27,65 24,54 22,46 C 21,41 23,38 26,38 C 28,38 29,42 30,48 L 32,58"
          stroke="#e2e8f0"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Middle Finger holding the mask cheek */}
        <path
          d="M 31,68 C 30,62 28,52 27,47 C 27,43 29,41 32,41 C 34,41 35,45 36,52 L 37,62"
          stroke="#cbd5e1"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Thumb curled on front edge */}
        <path
          d="M 35,71 C 37,66 40,62 43,62 C 45,62 45,65 43,68 C 41,71 38,76 35,80"
          stroke="#e2e8f0"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  href?: string;
  className?: string;
  adminVariant?: boolean;
  subtitle?: string;
}

export function BrandLogo({
  size = "md",
  showText = true,
  href = "/",
  className = "",
  adminVariant = false,
  subtitle,
}: BrandLogoProps) {
  // Dimension definitions
  const badgeSizeClasses = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-12 h-12 rounded-2xl",
    xl: "w-16 h-16 rounded-3xl",
  }[size];

  const iconPixels = {
    sm: 22,
    md: 26,
    lg: 32,
    xl: 42,
  }[size];

  const textSizeClasses = {
    sm: "text-lg font-black tracking-tight",
    md: "text-2xl font-black tracking-tight",
    lg: "text-3xl font-black tracking-tight",
    xl: "text-4xl font-black tracking-tight",
  }[size];

  const content = (
    <div className={`flex items-center gap-3 shrink-0 group ${className}`}>
      {/* Outer Glow Badge with Unmasking Face Icon */}
      <div
        className={`relative ${badgeSizeClasses} bg-slate-900 border border-slate-700/80 flex items-center justify-center text-white shadow-xl shadow-cyan-500/10 group-hover:shadow-cyan-500/25 group-hover:scale-105 group-hover:border-cyan-500/60 transition-all duration-300 overflow-hidden`}
      >
        {/* Subtle radial ambient glow inside the badge */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-fuchsia-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Vector Face Unmasking Himself */}
        <div className="relative z-10 flex items-center justify-center">
          <UnmaskFaceIcon size={iconPixels} />
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`${textSizeClasses} ${
              adminVariant
                ? "text-white"
                : "gradient-letter"
            }`}
          >
            UnMaskPeople
            <span className={adminVariant ? "text-violet-400" : "text-cyan-400"}>
              .in
            </span>
          </span>
          {subtitle && (
            <span
              className={`block text-[10px] uppercase tracking-widest font-bold ${
                adminVariant ? "text-violet-400" : "text-cyan-400"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
