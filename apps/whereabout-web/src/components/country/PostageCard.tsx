import type { IconType } from "react-icons";
import { withAlpha, type SectionColors, type TicketColors } from "@/lib/color";
import type { ContributeKind } from "@/lib/contribute";
import styles from "./PostageCard.module.css";

// Small alternating tilt so the board reads hand-placed.
export const POSTAGE_TILTS = [-0.6, 0.5, -0.4, 0.6, -0.5, 0.4];

// What each card looks like on the board. Only Visa & Entry is a ticket.
export type CardShape =
  | "ticket"
  | "globe"
  | "foldedMap"
  | "lined" // notebook page
  | "postIt"
  | "speech" // speech bubble
  | "clipboard"
  | "skyline" // postcard front
  | "calendar" // tear-off page
  | "indexCard";

// Pinned board item: title bottom-left, icon top-right (on the stub for tickets). No data: muted, inert.
// mark: contribute mode's ADD/DISPUTE stamp; "none" = contribute mode, nothing to stamp.
export default function PostageCard({
  title,
  icon: Icon,
  shape = "ticket",
  colors,
  hasData,
  mark,
  tilt = 0,
  onOpen,
}: {
  title: string;
  icon: IconType;
  shape?: CardShape;
  colors: TicketColors;
  hasData: boolean;
  mark?: ContributeKind | "none";
  tilt?: number;
  onOpen: () => void;
}) {
  const { body, stub } = colors;
  const label = (
    <>
      {mark && mark !== "none" && hasData && (
        // Solid chip; outline in the card's text color separates it from a same-color card.
        <span
          className={`tk-eyebrow ${styles.mark}`}
          style={{ borderColor: body.textColor, background: `var(--stamp-${mark})` }}
        >
          {mark === "add" ? "+ ADD" : "! DISPUTE"}
        </span>
      )}
      <span className={`sec-name ${styles.title}`} style={{ color: body.textColor }}>
        {title}
      </span>
      {!hasData && !mark && (
        <span className="src-row" style={{ fontSize: 11, marginTop: 3, color: withAlpha(body.textColor, 0.7) }}>
          Coming soon
        </span>
      )}
    </>
  );

  const item =
    shape === "ticket" ? (
      <span className={styles.frame}>
        <span className={styles.ticket} style={{ background: body.tint, color: body.textColor }}>
          <span className={styles.main}>{label}</span>
          <span className={styles.perf} style={{ "--perf": body.textColor } as React.CSSProperties} aria-hidden />
          <span className={styles.stub} style={{ background: stub.tint, color: stub.textColor }}>
            <Icon className={styles.icon} aria-hidden />
          </span>
        </span>
      </span>
    ) : (
      <span className={`${styles.paper} ${styles[shape]}`}>
        <Decor shape={shape} />
        <span className={styles.iconSlot} aria-hidden>
          <Icon className={styles.icon} />
        </span>
        <span className={styles.content}>{label}</span>
      </span>
    );

  const style = {
    "--tilt": `${tilt}deg`,
    "--body": body.tint,
    "--body-ink": body.textColor,
    "--accent": stub.tint,
    "--accent-ink": stub.textColor,
    // White card: ink shadow even on dark pages.
    ...(body.tint.toLowerCase() === "#ffffff" ? { "--drop": "var(--ink)" } : {}),
  } as React.CSSProperties;
  const className = `${styles.card} ${styles[`is-${shape}`] ?? ""} ${hasData ? styles.open : styles.empty}`;
  // Post-its stick on their own; clipboards hang by the clip; speech bubbles float.
  // Folded map: a second pin on the other fold peak.
  const pin = shape !== "postIt" && shape !== "clipboard" && shape !== "speech" && (
    <>
      <span className={styles.pin} aria-hidden />
      {shape === "foldedMap" && <span className={`${styles.pin} ${styles.pinRight}`} aria-hidden />}
    </>
  );
  return hasData ? (
    <button className={className} style={style} onClick={onOpen}>
      {item}
      {pin}
    </button>
  ) : (
    <div className={className} style={style}>
      {item}
      {pin}
    </div>
  );
}

// Outline shapes and printed details. SVGs stretch to the card; strokes stay 1.4px.
function Decor({ shape }: { shape: CardShape }) {
  const svg = (children: React.ReactNode) => (
    <svg className={styles.outline} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {children}
    </svg>
  );
  switch (shape) {
    case "foldedMap":
      return svg(
        <>
          <polygon className={styles.fill} points="0,7 25,0 50,7 75,0 100,7 100,100 75,93 50,100 25,93 0,100" />
          <polygon className={styles.shade} points="25,0 50,7 50,100 25,93" />
          <polygon className={styles.shade} points="75,0 100,7 100,100 75,93" />
          <polyline className={styles.crease} points="25,0 25,93" />
          <polyline className={styles.crease} points="50,7 50,100" />
          <polyline className={styles.crease} points="75,0 75,93" />
        </>,
      );
    case "skyline":
      return (
        <svg className={styles.skylineArt} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
          <polygon points="0,40 0,28 7,28 7,20 13,20 13,26 19,26 19,12 22,12 22,8 24,8 24,12 27,12 27,24 34,24 34,17 42,17 42,28 47,28 47,14 51,10 55,14 55,25 61,25 61,6 63,2 65,6 65,25 71,25 71,18 78,18 78,27 83,27 83,15 89,15 89,22 94,22 94,29 100,29 100,40" />
        </svg>
      );
    case "globe":
      return (
        <svg className={styles.outline} viewBox="0 0 100 100" aria-hidden>
          <ellipse className={styles.crease} cx="50" cy="50" rx="20" ry="50" />
          <ellipse className={styles.crease} cx="50" cy="50" rx="38" ry="50" />
          <line className={styles.crease} x1="50" y1="0" x2="50" y2="100" />
          <line className={styles.crease} x1="0" y1="27" x2="100" y2="27" />
          <line className={styles.crease} x1="0" y1="73" x2="100" y2="73" />
        </svg>
      );
    case "clipboard":
      return <span className={styles.clip} aria-hidden />;
    default:
      return null;
  }
}

// "Tap"/"Click" hint plus the 2/3-column grid. page: the background it sits on.
export function PostageGrid({
  page,
  contribute = false,
  children,
}: {
  page: SectionColors;
  contribute?: boolean;
  children: React.ReactNode;
}) {
  const vars = {
    "--page-ink": page.textColor,
    "--page-ink-soft": withAlpha(page.textColor, 0.7),
    // Dark page: white shadows and pin outlines so they show.
    ...(page.textColor === "#ffffff" ? { "--board-shadow": "#ffffff" } : {}),
  } as React.CSSProperties;
  return (
    <div className={styles.wrap} style={vars}>
      <div className={`tk-eyebrow ${styles.hint}`}>
        <span className={styles.touch}>TAP</span>
        <span className={styles.mouse}>CLICK</span> {contribute ? "A CARD TO ADD OR DISPUTE INFO" : "A CARD FOR DETAILS"}
      </div>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}
