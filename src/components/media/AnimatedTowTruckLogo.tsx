type Props = {
  className?: string
}

export function AnimatedTowTruckLogo({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Grúa"
    >
      <style>
        {`
          .tow-path {
            stroke-dasharray: 180;
            stroke-dashoffset: 180;
            animation: tow-draw 1.4s ease-out forwards;
          }
          .tow-wheel {
            animation: tow-pop 600ms ease-out 900ms both;
            transform-origin: center;
          }
          @keyframes tow-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes tow-pop {
            0% { transform: scale(0.6); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <path
        className="tow-path"
        d="M10 40h28l6-14h10l-2 8h-6l-4 10H26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="tow-path"
        d="M14 40V22h16l6 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="tow-path"
        d="M46 22l6-6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle
        className="tow-wheel"
        cx="20"
        cy="44"
        r="5"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        className="tow-wheel"
        cx="40"
        cy="44"
        r="5"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  )
}

