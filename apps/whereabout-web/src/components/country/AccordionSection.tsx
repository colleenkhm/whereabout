import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { withAlpha, type SectionColors } from "@/lib/color";

// One collapsible row. Every section renders, data or not.
export default function AccordionSection({
  title,
  colors,
  expanded,
  onToggle,
  hasData,
  children,
}: {
  title: string;
  colors: SectionColors;
  expanded: boolean;
  onToggle: () => void;
  hasData: boolean;
  children: React.ReactNode;
}) {
  const { tint, textColor } = colors;
  return (
    <section>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          background: tint,
          color: textColor,
          // Ring color comes from --section-ring on the page.
          boxShadow: "inset 0 0 0 2px var(--section-ring, currentColor), inset 0 0 0 3.5px rgba(255, 255, 255, 0.9)",        }}
      >
        <h2
          className="sec-name"
          style={{
            flex: 1,
            color: textColor,
            textDecorationLine: expanded ? "underline" : "none",
            textDecorationThickness: 1.5,
            textUnderlineOffset: 3,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            width: 31,
            height: 31,
            flexShrink: 0,
            borderRadius: "50%",
            border: `1.5px solid ${withAlpha(textColor, 0.35)}`,
            display: "grid",
            placeItems: "center",
            color: withAlpha(textColor, 0.8),
          }}
        >
          {expanded ? <MdKeyboardArrowUp size={18} /> : <MdKeyboardArrowDown size={18} />}
        </span>
      </button>
      {expanded && (
        // Color change is the seam; no divider between row and body.
        <div style={{ background: "var(--white)", borderBottom: "1px solid var(--rule)" }}>
          {hasData ? children : <ComingSoon />}
        </div>
      )}
    </section>
  );
}

function ComingSoon() {
  return (
    <p className="s-body" style={{ padding: "18px 20px", color: "var(--ink-3)", fontStyle: "italic" }}>
      Coming soon — we haven&apos;t curated this yet.
    </p>
  );
}
