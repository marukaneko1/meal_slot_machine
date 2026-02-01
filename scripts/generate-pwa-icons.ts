/**
 * PWA icon generator using Sharp
 * Creates PNG icons from an SVG template
 * 
 * Run with: npx tsx scripts/generate-pwa-icons.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const iconsDir = join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// SVG icon template - slot machine dice with gold theme
const createSvgIcon = (size: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="50%" style="stop-color:#FFA500"/>
      <stop offset="100%" style="stop-color:#FF8C00"/>
    </linearGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  
  <!-- Gold border -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="url(#gold)" stroke-width="8"/>
  
  <!-- Slot machine frame -->
  <rect x="80" y="140" width="352" height="200" rx="20" fill="#1f1f3a" stroke="url(#gold)" stroke-width="6"/>
  
  <!-- Three slot reels -->
  <rect x="100" y="160" width="96" height="160" rx="12" fill="#0d0d1a"/>
  <rect x="208" y="160" width="96" height="160" rx="12" fill="#0d0d1a"/>
  <rect x="316" y="160" width="96" height="160" rx="12" fill="#0d0d1a"/>
  
  <!-- Food emojis in slots (simplified as circles with colors) -->
  <circle cx="148" cy="240" r="32" fill="#FFD700"/>
  <text x="148" y="252" text-anchor="middle" font-size="48">🍗</text>
  
  <circle cx="256" cy="240" r="32" fill="#FFD700"/>
  <text x="256" y="252" text-anchor="middle" font-size="48">🥩</text>
  
  <circle cx="364" cy="240" r="32" fill="#FFD700"/>
  <text x="364" y="252" text-anchor="middle" font-size="48">🥦</text>
  
  <!-- Spin button -->
  <circle cx="256" cy="420" r="50" fill="url(#gold)"/>
  <circle cx="256" cy="420" r="40" fill="#dc2626"/>
  <text x="256" y="432" text-anchor="middle" font-size="28" fill="white" font-weight="bold">SPIN</text>
  
  <!-- Title banner -->
  <rect x="120" y="60" width="272" height="50" rx="10" fill="#dc2626"/>
  <text x="256" y="95" text-anchor="middle" font-size="28" fill="white" font-weight="bold" font-family="Arial, sans-serif">🎰 MEAL SLOT 🎰</text>
</svg>
`.trim();

// Generate PNG icons using Sharp
const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    const svgContent = createSvgIcon(size);
    const svgPath = join(iconsDir, `icon-${size}.svg`);
    const pngPath = join(iconsDir, `icon-${size}.png`);
    
    // Save SVG
    writeFileSync(svgPath, svgContent);
    console.log(`✅ Created ${svgPath}`);
    
    // Convert to PNG using Sharp
    try {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`✅ Created ${pngPath}`);
    } catch (err) {
      console.error(`❌ Failed to create PNG for ${size}:`, err);
    }
  }
}

generateIcons().then(() => {
  console.log('\n🎉 PWA icons generated successfully!\n');
}).catch(console.error);

// Cleanup: remove old HTML generator if exists
import { unlinkSync } from 'fs';
try {
  unlinkSync(join(iconsDir, 'generate-icons.html'));
} catch {
  // File doesn't exist, that's fine
}
