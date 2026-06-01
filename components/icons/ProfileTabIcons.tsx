interface TabIconProps {
  active: boolean;
}

export function GridTabIcon({ active }: TabIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return (
          <rect
            key={i}
            x={3 + col * 6.5}
            y={3 + row * 6.5}
            width="3"
            height="3"
            rx="0.6"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        );
      })}
    </svg>
  );
}

export function VideoTabIcon({ active }: TabIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10 8.6v6.8c0 .6.6 1 1.1.7l5.3-3.4c.4-.3.4-1 0-1.3l-5.3-3.4c-.5-.3-1.1 0-1.1.6z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}