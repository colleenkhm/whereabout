import type { IconBaseProps } from "react-icons";

// Head in profile, mouth open, three speech lines.
export default function TalkingIcon({ size = "1em", ...props }: IconBaseProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <path d="M5 22V16.5C3 15 2 12.5 2 10C2 5.5 5.6 2 10 2C13.8 2 16.6 4.6 17 8L18.8 11.2C19.1 11.7 18.8 12.2 18.3 12.2H17V12.6L15.2 13.4L17 14.2V15.5C17 16.6 16.1 17.5 15 17.5H12.5V22Z" />
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M19.8 10.4L22.6 9" />
        <path d="M20 13.4H23" />
        <path d="M19.8 16.4L22.6 17.8" />
      </g>
    </svg>
  );
}
