import { withAlpha } from "@/lib/color";
import ExternalLink from "../ExternalLink";

// Source footer for every section: notes left, links right.
export default function SectionSource({
  links,
  color,
  notes = [],
}: {
  links: [string, string][];
  color: string;
  notes?: string[];
}) {
  const wrap = { display: "flex", flexWrap: "wrap", gap: "4px 12px" } as const;
  return (
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${withAlpha(color, 0.15)}` }}>
      {notes.length > 0 && (
        <div style={wrap}>
          {notes.map((n) => (
            <span key={n} className="src-row">
              {n}
            </span>
          ))}
        </div>
      )}
      {links.length > 0 && (
        <div style={{ ...wrap, justifyContent: "flex-end", marginTop: notes.length ? 4 : 0 }}>
          {links.map(([label, url]) => (
            <ExternalLink key={url} label={label} url={url} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}
