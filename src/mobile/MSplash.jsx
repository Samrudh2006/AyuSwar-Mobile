// AyuSwar Mobile — launch splash: the user-selected rich scene artwork
// (original emblem composited in, TM removed) shown full-bleed.
// Pure CSS fade-out; MobileRoot controls timing via the done prop;
// never blocks app load.
import React from 'react';

export default function MSplash({ done }) {
  return (
    <div className={`m-splash ${done ? 'hide' : ''}`} aria-hidden={done}>
      <img className="m-splash-scene" src="/assets/ayuswar-splash-scene.webp" alt="" />
    </div>
  );
}
