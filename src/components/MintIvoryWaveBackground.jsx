import React from 'react';

/**
 * MintIvoryWaveBackground — Signature AyuSwar Ambient Medical Canvas
 * 
 * Implements the authentic healthcare & cultural background artwork
 * (ayuswar-background-source.jpg) with targeted upper-right wash masking
 * the background hospital so it only appears in hero banners, while
 * preserving the rich saffron/white/green ribbons, monuments, and warm atmosphere.
 */
export default function MintIvoryWaveBackground() {
  return (
    <div
      className="mint-ivory-wave-background"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#FAF8F5'
      }}
      aria-hidden="true"
    >
      {/* Authentic Cultural & Healthcare Background Layer */}
      <div
        className="ayuswar-artwork-bg-layer"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/assets/ayuswar-background-source.jpg')",
          backgroundPosition: 'center 42%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          opacity: 0.98
        }}
      />
      {/* Targeted Upper-Right Wash: masks the background hospital facade at top-right while preserving the rest of the canvas */}
      <div
        className="ayuswar-artwork-upper-mask"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '46%',
          height: '38%',
          background: 'radial-gradient(ellipse at top right, #FAF8F5 40%, rgba(250, 248, 245, 0.8) 65%, rgba(250, 248, 245, 0) 100%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
