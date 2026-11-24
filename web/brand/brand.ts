// Store art for Caliper, drawn in code: a yellow drafting square with engraved ticks on a graphite cutting mat.
const APP = (window as unknown as { APP?: { name: string; company: string } }).APP ?? { name: 'Caliper', company: '' };
const BG = '#1f2328', BG2 = '#16191d', GRID = '#2b3036', GRID_MAJOR = '#373d45', TOOL = '#ffcc1a', TOOL_HI = '#ffe066', TOOL_LO = '#e0a800', INK = '#111111', CYAN = '#3fd0ff', WHITE = '#eef0f2', MUTED = '#a8b0b9';

function canvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!] as const; }

function mat(g: CanvasRenderingContext2D, w: number, h: number, cell: number) {
  const gr = g.createRadialGradient(w * 0.45, h * 0.4, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  gr.addColorStop(0, BG); gr.addColorStop(1, BG2);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.lineWidth = Math.max(1, cell / 32);
  for (let i = 0, x = 0; x <= w; i++, x += cell) { g.strokeStyle = i % 2 ? GRID : GRID_MAJOR; g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
  for (let i = 0, y = 0; y <= h; i++, y += cell) { g.strokeStyle = i % 2 ? GRID : GRID_MAJOR; g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
}

/** The drafting square: an L of arm width `t` and outer size `s`, its corner at (x, y + s). */
function square(g: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, ticks = true) {
  const path = () => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + t, y); g.lineTo(x + t, y + s - t); g.lineTo(x + s, y + s - t); g.lineTo(x + s, y + s); g.lineTo(x, y + s); g.closePath(); };
  g.save();
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = s * 0.06; g.shadowOffsetY = s * 0.03;
  const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, TOOL_HI); gr.addColorStop(0.5, TOOL); gr.addColorStop(1, TOOL_LO);
  g.fillStyle = gr; path(); g.fill();
  g.restore();
  // bevel on the inner edges
  g.save(); path(); g.clip();
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = s * 0.012;
  g.beginPath(); g.moveTo(x, y + s * 0.006); g.lineTo(x + t, y + s * 0.006); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = s * 0.02;
  g.beginPath(); g.moveTo(x + t, y); g.lineTo(x + t, y + s - t); g.lineTo(x + s, y + s - t); g.stroke();
  g.restore();
  if (ticks) {
    g.strokeStyle = INK; g.lineCap = 'butt';
    const n = 14, step = (s - t - s * 0.06) / n;
    for (let i = 0; i <= n; i++) {
      const len = i % 5 === 0 ? t * 0.5 : i % 1 === 0 && i % 2 === 0 ? t * 0.34 : t * 0.22;
      g.lineWidth = i % 5 === 0 ? s * 0.014 : s * 0.009;
      const yy = y + s * 0.05 + i * step;
      g.beginPath(); g.moveTo(x + t, yy); g.lineTo(x + t - len, yy); g.stroke();
      const xx = x + s - s * 0.05 - i * step;
      g.beginPath(); g.moveTo(xx, y + s - t); g.lineTo(xx, y + s - t + len); g.stroke();
    }
  }
  g.fillStyle = BG; g.beginPath(); g.arc(x + t / 2, y + s - t / 2, t * 0.16, 0, Math.PI * 2); g.fill();
}

function arrowHead(g: CanvasRenderingContext2D, x: number, y: number, ang: number, size: number) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-size, -size * 0.45); g.lineTo(-size, size * 0.45); g.closePath(); g.fill(); g.restore();
}
/** A cyan angle arc in the square's corner, with arrowheads: the protractor hint. */
function angleArc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, w: number) {
  g.strokeStyle = CYAN; g.fillStyle = CYAN; g.lineWidth = w; g.lineCap = 'butt';
  const a0 = -Math.PI / 2 + 0.16, a1 = -0.16;
  g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
  arrowHead(g, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, a1 + Math.PI / 2, w * 3);
  arrowHead(g, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, a0 - Math.PI / 2, w * 3);
}

/** |←  label  →| in the given colour. */
function dimension(g: CanvasRenderingContext2D, x1: number, x2: number, y: number, label: string, font: string, color: string, tick: number) {
  g.save();
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  const tw = g.measureText(label).width + tick * 2.2, mid = (x1 + x2) / 2;
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = Math.max(2, tick / 7);
  g.beginPath(); g.moveTo(x1, y - tick); g.lineTo(x1, y + tick); g.moveTo(x2, y - tick); g.lineTo(x2, y + tick);
  g.moveTo(x1, y); g.lineTo(mid - tw / 2, y); g.moveTo(mid + tw / 2, y); g.lineTo(x2, y); g.stroke();
  arrowHead(g, x1, y, Math.PI, tick * 0.9); arrowHead(g, x2, y, 0, tick * 0.9);
  g.fillText(label, mid, y + 1);
  g.restore();
}

function iconArt(g: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const x = cx - s / 2, y = cy - s / 2, t = s * 0.27;
  square(g, x, y, s, t);
  angleArc(g, x + t, y + s - t, s * 0.36, s * 0.035);
}

async function icon() { const [c, g] = canvas(1024, 1024); mat(g, 1024, 1024, 64); iconArt(g, 512, 512, 620); return c; }
async function adaptive() { const [c, g] = canvas(1024, 1024); iconArt(g, 512, 512, 590); return c; }
async function adaptiveBg() { const [c, g] = canvas(1024, 1024); mat(g, 1024, 1024, 64); return c; }

async function splash() {
  const W = 1242, H = 2688; const [c, g] = canvas(W, H); mat(g, W, H, 78);
  iconArt(g, W / 2, H * 0.4, 560);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = WHITE; g.font = '800 168px "Red Hat Display"'; g.fillText(APP.name, W / 2, H * 0.4 + 520);
  dimension(g, W / 2 - 300, W / 2 + 300, H * 0.4 + 610, '64.0 mm', '600 40px "Red Hat Mono"', TOOL, 26);
  g.fillStyle = MUTED; g.font = '500 42px "Red Hat Mono"'; g.fillText('Ruler · Protractor · Level · Ring', W / 2, H * 0.4 + 720);
  return c;
}

async function feature() {
  const W = 1024, H = 500; const [c, g] = canvas(W, H); mat(g, W, H, 32);
  // a yellow rule along the bottom edge
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18; g.shadowOffsetY = -4;
  g.fillStyle = TOOL; g.fillRect(0, H - 74, W, 74); g.restore();
  g.strokeStyle = INK;
  for (let i = 0, x = 20; x < W; i++, x += 8) {
    const len = i % 10 === 0 ? 30 : i % 5 === 0 ? 20 : 11; g.lineWidth = i % 10 === 0 ? 2.2 : 1.4;
    g.beginPath(); g.moveTo(x + 0.5, H - 74); g.lineTo(x + 0.5, H - 74 + len); g.stroke();
    if (i % 10 === 0) { g.fillStyle = INK; g.font = '600 15px "Red Hat Mono"'; g.textAlign = 'left'; g.fillText(String(i / 10), x + 4, H - 74 + 30); }
  }
  // the protractor arc on the right
  const cx = 800, cy = H - 74, R = 168;
  g.save(); g.fillStyle = 'rgba(255,204,26,.16)'; g.strokeStyle = TOOL; g.lineWidth = 3;
  g.beginPath(); g.arc(cx, cy, R, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.restore();
  g.strokeStyle = WHITE; g.globalAlpha = 0.85;
  for (let d = 0; d <= 180; d += 2) {
    const a = Math.PI + (d * Math.PI) / 180, len = d % 10 === 0 ? 18 : 9; g.lineWidth = d % 10 === 0 ? 2 : 1.2;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R - len), cy + Math.sin(a) * (R - len)); g.stroke();
  }
  g.globalAlpha = 1;
  g.strokeStyle = 'rgba(255,204,26,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R * 0.36, Math.PI, 0); g.stroke();
  const arm = (deg: number) => { const a = (-deg * Math.PI) / 180; g.strokeStyle = CYAN; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R + 28), cy + Math.sin(a) * (R + 28)); g.stroke();
    g.fillStyle = TOOL; g.beginPath(); g.arc(cx + Math.cos(a) * (R + 28), cy + Math.sin(a) * (R + 28), 15, 0, Math.PI * 2); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); };
  g.fillStyle = 'rgba(63,208,255,.22)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R * 0.3, -2.09, -0.35); g.closePath(); g.fill();
  arm(20); arm(120);
  g.fillStyle = TOOL; g.beginPath(); g.arc(cx, cy, 8, 0, Math.PI * 2); g.fill();
  // wordmark and tagline on the left
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 12;
  square(g, 56, 70, 92, 26, false);
  g.restore();
  g.fillStyle = WHITE; g.textAlign = 'left'; g.font = '800 92px "Red Hat Display"'; g.fillText(APP.name, 168, 156);
  dimension(g, 60, 520, 214, APP.name.toUpperCase(), '600 22px "Red Hat Mono"', TOOL, 16);
  g.fillStyle = WHITE; g.font = '700 28px "Red Hat Display"'; g.fillText('Your phone as a ruler, protractor', 60, 284);
  g.fillText('and spirit level.', 60, 320);
  g.fillStyle = MUTED; g.font = '500 18px "Red Hat Mono"'; g.fillText('Ruler · Protractor · Level · Ring sizer · Offline', 60, 366);
  return c;
}
(window as unknown as { brand: object }).brand = { icon, adaptive, adaptiveBg, splash, feature };
