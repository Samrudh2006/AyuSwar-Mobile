import React from 'react';

/**
 * Looseleaf Hand-Drawn Design Primitives
 * Inspired by Looseleaf (shadcn/ui drawn by hand by Kevin Ngo)
 * Deterministic SVG seeds & CSS styles for authentic notebook paper, ink stamps,
 * tape stickers, and marker highlights.
 */

// Authentic wobbly SVG path for a card/box of size w x h
export function generateSketchRectPath(w = 200, h = 100, seed = 1) {
  // Deterministic subtle offsets based on seed
  const o1 = ((seed * 17) % 7) - 3;
  const o2 = ((seed * 23) % 7) - 3;
  const o3 = ((seed * 31) % 7) - 3;
  const o4 = ((seed * 41) % 7) - 3;
  const r = 8; // gentle corner curve
  
  return `M ${r + o1} ${1 + o2} 
          Q ${w / 2 + o3} ${0} ${w - r + o2} ${1 + o1} 
          Q ${w + o4} ${r} ${w - 1 + o3} ${r + 6} 
          L ${w + o1} ${h - r + o2} 
          Q ${w} ${h + o3} ${w - r + o4} ${h - 1 + o1} 
          Q ${w / 2 + o2} ${h + 1} ${r + o3} ${h + o4} 
          Q ${0} ${h - r} ${1 + o1} ${h - r - 4} 
          L ${0 + o2} ${r + o3} 
          Q ${0} ${0} ${r + o1} ${1 + o2} Z`;
}

// Hand-drawn sketchy border component for wrapping any card
export function SketchBorder({
  color = '#1E293B',
  strokeWidth = 2,
  roughness = 'medium',
  className = '',
  style = {},
  children
}) {
  return (
    <div
      className={`sketch-border-wrapper ${className}`}
      style={{
        position: 'relative',
        ...style
      }}
    >
      <svg
        className="sketch-border-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 1
        }}
      >
        <path
          d="M 4 2 Q 50 0.5 96 2 Q 99 2 98 6 L 99 94 Q 99 98 95 98 Q 50 99.5 4 98 Q 1 98 2 94 L 1 6 Q 1 2 4 2 Z"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="2000"
          style={{ opacity: 0.85 }}
        />
        {/* Second faint hand-drawn pass for organic pen texture */}
        <path
          d="M 5 3 Q 51 1.5 95 3 Q 98 3 97 7 L 98 93 Q 98 97 94 97 Q 51 98.5 5 97 Q 2 97 3 93 L 2 7 Q 2 3 5 3 Z"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth * 0.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ opacity: 0.35 }}
        />
      </svg>
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}

// Tape Sticker (for sticky notes / pinboard look)
export function WashiTape({ color = '#FEF08A', angle = '-2deg', width = '80px', top = '-12px', left = '50%' }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top,
        left,
        transform: `translateX(-50%) rotate(${angle})`,
        width,
        height: '20px',
        backgroundColor: color,
        opacity: 0.78,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        zIndex: 5,
        clipPath: 'polygon(0% 15%, 5% 0%, 95% 0%, 100% 15%, 98% 85%, 100% 100%, 5% 100%, 0% 85%)',
        backdropFilter: 'blur(2px)'
      }}
    />
  );
}

// Marker Highlighter effect (behind text)
export function MarkerHighlight({ children, color = '#FEF08A', textColor = '#1E293B', style = {} }) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        padding: '1px 6px',
        margin: '0 2px',
        fontWeight: 700,
        color: textColor,
        zIndex: 1,
        ...style
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '12% -2px 10% -2px',
          background: color,
          opacity: 0.85,
          borderRadius: '4px',
          transform: 'rotate(-0.8deg)',
          zIndex: -1,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      />
      {children}
    </span>
  );
}

// Decorative ink stamp; default labels are demo-safe, never approval claims
export function InkStamp({ label = 'SYNTHETIC DEMO', sublabel = 'NOT CLINICALLY SIGNED', color = '#B91C1C', angle = '-8deg' }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 14px',
        border: `3px solid ${color}`,
        borderRadius: '8px',
        color: color,
        transform: `rotate(${angle})`,
        boxShadow: `inset 0 0 0 1px ${color}30, 0 2px 8px ${color}20`,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 900,
        opacity: 0.9,
        background: `${color}06`,
        userSelect: 'none',
        pointerEvents: 'none'
      }}
    >
 <span style={{ fontSize: '11.5px', lineHeight: 1.1 }}>★ {label} ★</span>
      {sublabel && (
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', marginTop: '2px', opacity: 0.85 }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

// Hand-Drawn Sketchy Arrow SVG
export function SketchArrow({ direction = 'right', color = '#0F4C5C', width = 48, height = 24 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 48 24" fill="none" style={{ overflow: 'visible' }}>
      <path
        d="M 4 12 Q 24 10 42 12 M 34 5 Q 39 9 44 12 Q 39 15 33 19"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

