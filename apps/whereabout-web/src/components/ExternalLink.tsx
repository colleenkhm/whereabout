import { MdArrowOutward } from "react-icons/md";

// "Label ↗" link, opens in a new tab.
export default function ExternalLink({
  label,
  url,
  color = "var(--sky-dark)",
}: {
  label: string;
  url: string;
  color?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ fontFamily: "var(--dm-mono)", fontWeight: 600, fontSize: 11.5, color, whiteSpace: "normal" }}
    >
      {label}
      <MdArrowOutward size={11} style={{ marginLeft: 2, verticalAlign: "-1px" }} aria-hidden />
    </a>
  );
}
