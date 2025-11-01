type CalculatorSpinnerProps = {
  size?: number;
  className?: string;
};

export function CalculatorSpinner({ size = 48, className = "" }: CalculatorSpinnerProps) {
  const dimension = `${size}px`;

  return (
    <div
      className={["relative inline-flex items-center justify-center", className].filter(Boolean).join(" ")}
      style={{ width: dimension, height: dimension }}
      aria-hidden
    >
      <div
        className="absolute inset-0 animate-spin rounded-full"
        style={{
          backgroundImage: "conic-gradient(from 90deg, #36D6C3, #3AC6FF, #8E58FF, #36D6C3)",
          mask: "radial-gradient(farthest-side, transparent calc(55%), black calc(60%))",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(55%), black calc(60%))",
        }}
      />
      <div className="absolute inset-[22%] rounded-full bg-slate-950/80 shadow-inner shadow-[0_0_16px_rgba(8,24,39,0.4)]" />
    </div>
  );
}
