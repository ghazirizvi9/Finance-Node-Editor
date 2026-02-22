export const CHILD_TABLE_PALETTE = [
  '#3b82f6',
  '#14b8a6',
  '#f97316',
  '#f43f5e',
  '#22c55e',
  '#8b5cf6',
  '#eab308',
  '#06b6d4',
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => `${c}${c}`).join('')
    : normalized;

  const int = Number.parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(clamp(Math.round(r), 0, 255))}${toHex(clamp(Math.round(g), 0, 255))}${toHex(clamp(Math.round(b), 0, 255))}`;
}

export function lightenHex(hex: string, ratio: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = clamp(ratio, 0, 1);
  return rgbToHex(
    r + (255 - r) * mix,
    g + (255 - g) * mix,
    b + (255 - b) * mix
  );
}

export function getChildTableColors(index: number): { headerColor: string; subheaderColor: string } {
  const headerColor = CHILD_TABLE_PALETTE[index % CHILD_TABLE_PALETTE.length];
  const subheaderColor = lightenHex(headerColor, 0.32);
  return { headerColor, subheaderColor };
}
