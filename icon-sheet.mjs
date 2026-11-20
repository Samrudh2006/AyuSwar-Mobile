// Scratch: render the reworked MIcons to a contact sheet and screenshot it. Never commit.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { chromium } from 'playwright';

// MIcons is JSX; load it through vite's SSR transform
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const Icons = await server.ssrLoadModule('/src/mobile/MIcons.jsx');
await server.close();

const names = ['IconMic', 'IconUser', 'IconCalendar', 'IconFile', 'IconShield', 'IconPhone', 'IconPill', 'IconWave', 'IconPulseHeart'];

function tile(name, size, dark) {
  const svg = renderToStaticMarkup(React.createElement(Icons[name], { size }));
  return `<div style="width:120px;padding:12px 4px;text-align:center;background:${dark ? '#0A2540' : '#FFFDF6'};color:${dark ? '#EAF2F6' : '#122A46'};border-radius:12px;margin:4px">
    <div style="display:inline-block">${svg}</div>
    <div style="font:600 11px system-ui;margin-top:6px;color:${dark ? '#9FB6C3' : '#52707C'}">${name.replace('Icon', '')} ${size}px${dark ? ' dark' : ''}</div>
  </div>`;
}

let html = '<html><body style="background:#F1F5F4;font-family:system-ui;padding:16px">';
for (const size of [24, 48]) {
  html += `<h3 style="font:700 14px system-ui;color:#122A46">${size}px — light / dark</h3><div style="display:flex;flex-wrap:wrap">`;
  for (const n of names) html += tile(n, size, false) + tile(n, size, true);
  html += '</div>';
}
html += '</body></html>';
writeFileSync('/tmp/icon-sheet.html', html);

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: 1240, height: 900 } });
await p.goto('file:///tmp/icon-sheet.html');
await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/icon-sheet.png', fullPage: true });
await b.close();
console.log('sheet written');
