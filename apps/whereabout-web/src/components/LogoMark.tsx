// The logo's "?" alone; inherits text color.
export default function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.2 8.4C7.2 5.6 9.3 3.6 12.2 3.6C15.1 3.6 17.1 5.4 17.1 7.9C17.1 10.2 15.5 11.2 14.1 12.3C12.8 13.3 12.1 14.1 12.1 15.4"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={12.1} cy={20.7} r={2.3} fill="currentColor" />
    </svg>
  );
}
