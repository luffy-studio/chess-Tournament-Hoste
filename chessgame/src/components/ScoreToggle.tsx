import { Result } from '../types';

interface ScoreToggleProps {
  value: Result;
  onChange: (v: Exclude<Result, null>) => void;
}

export function ScoreToggle({ value, onChange }: ScoreToggleProps) {
  return (
    <div className="inline-flex rounded-2xl shadow-sm overflow-hidden border">
      <button
        type="button"
        className={`px-3 py-1 text-sm font-medium ${value === "W" ? "bg-black text-white" : "bg-white"}`}
        onClick={() => onChange("W")}
      >
        A wins (1–0)
      </button>
      <button
        type="button"
        className={`px-3 py-1 text-sm font-medium ${value === "D" ? "bg-black text-white" : "bg-white"}`}
        onClick={() => onChange("D")}
      >
        Draw (0.5–0.5)
      </button>
      <button
        type="button"
        className={`px-3 py-1 text-sm font-medium ${value === "L" ? "bg-black text-white" : "bg-white"}`}
        onClick={() => onChange("L")}
      >
        B wins (0–1)
      </button>
    </div>
  );
}
