import { STATE_GLYPHS, type GlyphKind } from "./banditModel";

/**
 * A distinct "fractal" badge per state — a stand-in for the paper's fractal image stimuli
 * (which are not redistributed here). Six recognizable motifs so the reader can learn a
 * state→key mapping the way a participant learns image→key.
 */
export function StateGlyph({ state, size = 72 }: { state: number; size?: number }) {
  const { color, kind } = STATE_GLYPHS[state];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`stimulus ${state + 1}`}>
      <rect x="1" y="1" width="98" height="98" rx="12" fill={color} opacity={0.12} />
      <rect x="1" y="1" width="98" height="98" rx="12" fill="none" stroke={color} strokeWidth={1.5} opacity={0.5} />
      <Motif kind={kind} color={color} />
    </svg>
  );
}

function Motif({ kind, color }: { kind: GlyphKind; color: string }) {
  const c = color;
  switch (kind) {
    case "burst":
      return (
        <g stroke={c} strokeWidth={3} strokeLinecap="round">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={50 + 10 * Math.cos(a)}
                y1={50 + 10 * Math.sin(a)}
                x2={50 + 34 * Math.cos(a)}
                y2={50 + 34 * Math.sin(a)}
              />
            );
          })}
          <circle cx={50} cy={50} r={7} fill={c} stroke="none" />
        </g>
      );
    case "bloom":
      return (
        <g fill={c} opacity={0.85}>
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx={50} cy={30} rx={9} ry={20} transform={`rotate(${i * 60} 50 50)`} />
          ))}
          <circle cx={50} cy={50} r={6} fill="var(--background)" />
        </g>
      );
    case "star":
      return (
        <polygon
          points={starPoints(50, 50, 36, 15, 5)}
          fill={c}
          opacity={0.9}
        />
      );
    case "gear":
      return (
        <g fill={c}>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={46} y={12} width={8} height={16} transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <circle cx={50} cy={50} r={22} />
          <circle cx={50} cy={50} r={9} fill="var(--background)" />
        </g>
      );
    case "orbit":
      return (
        <g fill="none" stroke={c} strokeWidth={3}>
          <circle cx={50} cy={50} r={30} opacity={0.5} />
          <circle cx={50} cy={50} r={18} />
          <circle cx={50} cy={20} r={5} fill={c} stroke="none" />
          <circle cx={72} cy={62} r={4} fill={c} stroke="none" />
          <circle cx={50} cy={50} r={5} fill={c} stroke="none" />
        </g>
      );
    case "prism":
      return (
        <g fill="none" stroke={c} strokeWidth={3} strokeLinejoin="round">
          <polygon points="50,16 82,70 18,70" />
          <polygon points="50,38 68,68 32,68" opacity={0.7} />
        </g>
      );
  }
}

function starPoints(cx: number, cy: number, outer: number, inner: number, points: number): string {
  const step = Math.PI / points;
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = i * step - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}
