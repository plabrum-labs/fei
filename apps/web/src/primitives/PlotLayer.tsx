export interface PlotLayerProps {
  data: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
}

// Stub — real plotting (d3 or similar) deferred until the first real widget needs it.
export function PlotLayer({ data, width = 480, height = 320 }: PlotLayerProps) {
  return (
    <svg width={width} height={height} className="border border-gray-300">
      <text x={8} y={20} className="fill-gray-400 text-sm">
        PlotLayer stub — {data.length} points
      </text>
    </svg>
  );
}
