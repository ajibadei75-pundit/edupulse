export function HeartbeatLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" className={className} aria-hidden>
      <path
        d="M0 30 L80 30 L100 30 L110 10 L125 50 L140 5 L155 55 L170 30 L400 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="600"
        strokeDashoffset="600"
        style={{ animation: "ep-ecg-draw 3s ease-in-out infinite" }}
      />
      <style>{`
        @keyframes ep-ecg-draw {
          0% { stroke-dashoffset: 600; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -600; }
        }
      `}</style>
    </svg>
  );
}
