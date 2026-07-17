export interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

export function Slider({ label, min, max, step = 1, value, onChange }: SliderProps) {
  return (
    <label className="flex items-center gap-2">
      <span className="whitespace-nowrap">{label}</span>
      <input
        type="range"
        className="min-w-0 flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="tabular-nums">{value}</span>
    </label>
  );
}
