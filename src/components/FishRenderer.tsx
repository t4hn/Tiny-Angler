import React from 'react';
import { SilhouetteShape, FishVariant } from '../types/fishing';

interface FishRendererProps {
  shape?: SilhouetteShape;
  variant?: FishVariant;
  palette?: {
    body: string;
    fins: string;
    belly: string;
    pattern: string;
  };
  mode?: 'full' | 'silhouette';
  sizeCm?: number;
  width?: number;
  height?: number;
  tailAngle?: number;
  className?: string;
}

export const FishRenderer: React.FC<FishRendererProps> = ({
  shape = 'slender',
  variant = 'Standard',
  palette = {
    body: '#38bdf8',
    fins: '#0284c7',
    belly: '#f0f9ff',
    pattern: '#0369a1',
  },
  mode = 'full',
  sizeCm,
  width = 120,
  height = 60,
  tailAngle = 0,
  className = '',
}) => {
  // Variant color overrides if variant is set
  let colors = { ...palette };
  if (variant === 'Golden') {
    colors = {
      body: '#eab308',
      fins: '#facc15',
      belly: '#fef08a',
      pattern: '#ca8a04',
    };
  } else if (variant === 'Albino') {
    colors = {
      body: '#f8fafc',
      fins: '#fecdd3',
      belly: '#ffffff',
      pattern: '#e2e8f0',
    };
  } else if (variant === 'Shadow') {
    colors = {
      body: '#1e293b',
      fins: '#334155',
      belly: '#475569',
      pattern: '#0f172a',
    };
  } else if (variant === 'Neon Glow') {
    colors = {
      body: '#06b6d4',
      fins: '#a855f7',
      belly: '#67e8f9',
      pattern: '#3b82f6',
    };
  } else if (variant === 'Iridescent') {
    colors = {
      body: '#ec4899',
      fins: '#8b5cf6',
      belly: '#fbcfe8',
      pattern: '#06b6d4',
    };
  }

  const isSilhouette = mode === 'silhouette';
  const fillColor = isSilhouette ? '#0f172a' : colors.body;
  const finColor = isSilhouette ? '#0f172a' : colors.fins;
  const bellyColor = isSilhouette ? '#0f172a' : colors.belly;
  const patternColor = isSilhouette ? '#0f172a' : colors.pattern;
  const eyeColor = isSilhouette
    ? 'transparent'
    : variant === 'Albino'
    ? '#e11d48'
    : variant === 'Neon Glow'
    ? '#22d3ee'
    : '#0f172a';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 120 60"
        className="w-full h-full overflow-visible transition-transform duration-100"
        style={{
          filter: isSilhouette
            ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
            : variant === 'Neon Glow'
            ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
            : variant === 'Golden'
            ? 'drop-shadow(0 0 7px rgba(234, 179, 8, 0.5))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}
      >
        <g>
          {/* Dorsal Fin */}
          {shape === 'round' && (
            <path
              d="M 45 16 C 52 4, 75 8, 85 18 Z"
              fill={finColor}
              opacity={isSilhouette ? 0.9 : 0.85}
            />
          )}
          {shape === 'slender' && (
            <path
              d="M 50 18 C 58 8, 72 12, 78 22 Z"
              fill={finColor}
              opacity={isSilhouette ? 0.9 : 0.85}
            />
          )}
          {shape === 'wide' && (
            <path
              d="M 40 18 C 50 7, 78 10, 84 21 Z"
              fill={finColor}
              opacity={isSilhouette ? 0.9 : 0.85}
            />
          )}
          {shape === 'giant' && (
            <path
              d="M 42 14 C 55 2, 78 6, 88 18 Z"
              fill={finColor}
              opacity={isSilhouette ? 0.9 : 0.85}
            />
          )}
          {shape === 'eel' && (
            <path
              d="M 28 20 C 50 10, 85 14, 98 25 Z"
              fill={finColor}
              opacity={isSilhouette ? 0.9 : 0.85}
            />
          )}

          {/* Tail Fin with animation transform */}
          <g transform={`rotate(${tailAngle}, 95, 30)`}>
            {shape === 'slender' && (
              <path
                d="M 92 30 C 104 18, 115 14, 118 20 C 114 26, 108 30, 114 34 C 118 40, 105 44, 92 30 Z"
                fill={finColor}
              />
            )}
            {shape === 'round' && (
              <path
                d="M 90 30 C 102 12, 118 16, 116 30 C 118 44, 102 48, 90 30 Z"
                fill={finColor}
              />
            )}
            {shape === 'wide' && (
              <path
                d="M 90 30 C 105 16, 116 20, 114 30 C 116 40, 105 44, 90 30 Z"
                fill={finColor}
              />
            )}
            {shape === 'giant' && (
              <path
                d="M 90 30 C 106 10, 120 14, 118 26 C 112 30, 112 32, 118 36 C 120 48, 106 50, 90 30 Z"
                fill={finColor}
              />
            )}
            {shape === 'eel' && (
              <path
                d="M 98 30 C 108 24, 116 27, 118 30 C 116 33, 108 36, 98 30 Z"
                fill={finColor}
              />
            )}
          </g>

          {/* Ventral / Pelvic Fin */}
          <path
            d="M 52 42 C 58 52, 68 50, 64 42 Z"
            fill={finColor}
            opacity={isSilhouette ? 0.9 : 0.85}
          />

          {/* Main Body */}
          {shape === 'round' && (
            <ellipse cx="60" cy="30" rx="36" ry="18" fill={fillColor} />
          )}
          {shape === 'slender' && (
            <path
              d="M 20 30 C 30 18, 70 18, 95 30 C 70 42, 30 42, 20 30 Z"
              fill={fillColor}
            />
          )}
          {shape === 'wide' && (
            <path
              d="M 18 30 C 30 14, 75 16, 94 30 C 75 46, 30 46, 18 30 Z"
              fill={fillColor}
            />
          )}
          {shape === 'giant' && (
            <path
              d="M 14 30 C 26 12, 75 14, 94 30 C 75 48, 26 48, 14 30 Z"
              fill={fillColor}
            />
          )}
          {shape === 'eel' && (
            <path
              d="M 14 30 C 24 22, 75 22, 100 30 C 75 38, 24 38, 14 30 Z"
              fill={fillColor}
            />
          )}

          {/* Detailed Features (only in full mode) */}
          {!isSilhouette && (
            <>
              {/* Belly Shading */}
              <path
                d="M 28 32 C 40 40, 70 40, 84 32 C 70 43, 40 43, 28 32 Z"
                fill={bellyColor}
                opacity={0.7}
              />

              {/* Decorative Markings / Tiger Stripes / Scales */}
              <g stroke={patternColor} strokeWidth="1.8" strokeLinecap="round" opacity={0.55}>
                <line x1="45" y1="20" x2="48" y2="34" />
                <line x1="56" y1="18" x2="60" y2="35" />
                <line x1="68" y1="20" x2="71" y2="33" />
              </g>

              {/* Lateral Line */}
              <path
                d="M 32 30 Q 60 28 82 30"
                fill="none"
                stroke={patternColor}
                strokeWidth="1.2"
                strokeDasharray="2,3"
                opacity={0.4}
              />

              {/* Gill Cover */}
              <path
                d="M 36 24 C 40 28, 40 34, 36 38"
                fill="none"
                stroke={patternColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity={0.8}
              />

              {/* Pectoral Fin */}
              <path
                d="M 42 32 C 52 32, 56 38, 46 41 C 42 41, 40 36, 42 32 Z"
                fill={finColor}
                opacity={0.9}
              />

              {/* Eye Outer & Pupil */}
              <circle cx="28" cy="27" r="3.2" fill="#ffffff" />
              <circle cx="27.5" cy="27" r="1.8" fill={eyeColor} />
              <circle cx="26.8" cy="26.2" r="0.7" fill="#ffffff" />

              {/* Variant Shimmer Overlays */}
              {variant === 'Golden' && (
                <circle cx="50" cy="24" r="1.5" fill="#ffffff" opacity={0.7} />
              )}
              {variant === 'Neon Glow' && (
                <ellipse cx="60" cy="30" rx="30" ry="12" fill="none" stroke="#67e8f9" strokeWidth="0.8" opacity={0.6} />
              )}
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
