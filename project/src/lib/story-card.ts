import type { Creator } from '@/types';

export interface StoryCardVariant {
  id: string;
  en: string;
  fr: string;
  kr: string;
}

export const STORY_CARD_VARIANTS: StoryCardVariant[] = [
  {
    id: 'on-hatis',
    en: "I'm on Hatis",
    fr: "Je suis sur Hatis",
    kr: "Mwen sou Hatis",
  },
  {
    id: 'support-my-work',
    en: 'Support my work',
    fr: 'Soutenez mon travail',
    kr: 'Soutni travay mwen',
  },
  {
    id: 'official-support-page',
    en: 'My official support page',
    fr: 'Ma page de soutien officielle',
    kr: 'Paj ofisyèl soutni mwen',
  },
];

export const STORY_CARD_CAPTIONS: Record<string, { en: string; fr: string; kr: string }> = {
  'on-hatis': {
    en: 'Find me on Hatis — the home for Haitian creators. Discover my work and support me directly.',
    fr: 'Retrouvez-moi sur Hatis — la maison des créateurs haïtiens. Découvrez mon travail et soutenez-moi directement.',
    kr: 'Jwenn mwen sou Hatis — lakay kreyatè ayisyen. Dekouvri travay mwen epi soutni mwen dirèkteman.',
  },
  'support-my-work': {
    en: 'Love what I do? Support my work directly through Hatis. Every bit helps me keep creating.',
    fr: 'Vous aimez ce que je fais ? Soutenez mon travail directement via Hatis. Chaque geste compte.',
    kr: 'Ou renmen sa m ap fè? Soutni travay mwen dirèkteman sou Hatis. Chak ti gès konpte.',
  },
  'official-support-page': {
    en: 'This is my official support page on Hatis. Support me using the payment method that works for you.',
    fr: "Ceci est ma page de soutien officielle sur Hatis. Soutenez-moi avec le moyen de paiement qui vous convient.",
    kr: 'Sa a se paj ofisyèl soutni mwen sou Hatis. Soutni mwen ak metòd pamman ki konvenyans pou ou.',
  },
};

type Lang = 'en' | 'fr' | 'kr';

export function generateStoryCard(
  creator: Creator,
  variantId: string,
  lang: Lang,
  profileUrl: string,
): string {
  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const variant = STORY_CARD_VARIANTS.find((v) => v.id === variantId);
  if (!variant) return '';
  const text = variant[lang];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#f43f5e');
  grad.addColorStop(0.5, '#fb7185');
  grad.addColorStop(1, '#f97316');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative circles
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(W * 0.2, H * 0.15, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.85, 400, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Logo area
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Hatis', W / 2, 180);

  // Heart icon (simple)
  const hx = W / 2;
  const hy = 300;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const heartSize = 50;
  ctx.moveTo(hx, hy + heartSize * 0.3);
  ctx.bezierCurveTo(hx, hy, hx - heartSize, hy - heartSize * 0.3, hx - heartSize, hy - heartSize * 0.6);
  ctx.bezierCurveTo(hx - heartSize, hy - heartSize, hx - heartSize * 0.4, hy - heartSize * 1.1, hx, hy - heartSize * 0.7);
  ctx.bezierCurveTo(hx + heartSize * 0.4, hy - heartSize * 1.1, hx + heartSize, hy - heartSize, hx + heartSize, hy - heartSize * 0.6);
  ctx.bezierCurveTo(hx + heartSize, hy - heartSize * 0.3, hx, hy, hx, hy + heartSize * 0.3);
  ctx.fill();

  // Avatar circle
  const avatarY = H * 0.42;
  const avatarR = 160;
  if (creator.avatar_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = creator.avatar_url;
        if (img.complete) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
          ctx.clip();
          const aspect = img.width / img.height;
          const drawW = avatarR * 2;
          const drawH = drawW / aspect;
          ctx.drawImage(img, W / 2 - drawW / 2, avatarY - drawH / 2, drawW, drawH);
          ctx.restore();
        } else {
          drawAvatarPlaceholder(ctx, W / 2, avatarY, avatarR, creator);
        }
      } catch {
        drawAvatarPlaceholder(ctx, W / 2, avatarY, avatarR, creator);
      }
  } else {
    drawAvatarPlaceholder(ctx, W / 2, avatarY, avatarR, creator);
  }

  // White border around avatar
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR + 6, 0, Math.PI * 2);
  ctx.stroke();

  // Creator name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  const name = creator.display_name || creator.name;
  ctx.fillText(name, W / 2, avatarY + avatarR + 100);

  // Tagline
  if (creator.tagline) {
    ctx.font = '36px Inter, system-ui, sans-serif';
    ctx.globalAlpha = 0.9;
    wrapText(ctx, creator.tagline, W / 2, avatarY + avatarR + 160, W - 160, 48);
    ctx.globalAlpha = 1;
  }

  // Main variant text
  ctx.font = 'bold 72px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, text, W / 2, H * 0.72, W - 120, 90);

  // URL
  ctx.font = 'bold 44px Inter, system-ui, sans-serif';
  ctx.globalAlpha = 0.85;
  ctx.fillText(profileUrl, W / 2, H * 0.88);
  ctx.globalAlpha = 1;

  // Bottom tagline
  ctx.font = '32px Inter, system-ui, sans-serif';
  ctx.globalAlpha = 0.7;
  ctx.fillText('Discover and support Haitian creators', W / 2, H * 0.94);
  ctx.globalAlpha = 1;

  return canvas.toDataURL('image/png');
}

function drawAvatarPlaceholder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  creator: Creator,
) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f43f5e';
  ctx.font = `bold ${r}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((creator.display_name || creator.name).charAt(0).toUpperCase(), cx, cy);
  ctx.textBaseline = 'alphabetic';
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const totalHeight = lines.length * lineHeight;
  const startYAdjusted = startY - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, cx, startYAdjusted + i * lineHeight);
  });
}

export function downloadStoryCard(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
