import type { IconType } from "react-icons";
import { withAlpha, type SectionColors, type TicketColors } from "@/lib/color";
import type { ContributeKind } from "@/lib/contribute";
import styles from "./PostageCard.module.css";

// Small alternating tilt so the grid reads hand-placed.
export const POSTAGE_TILTS = [-0.6, 0.5, -0.4, 0.6, -0.5, 0.4];

// Pinned admission ticket: title in the body's corner, icon on the stub. No data: muted, inert.
// mark: contribute mode's ADD/DISPUTE stamp; "none" = contribute mode, nothing to stamp.
export default function PostageCard({
  title,
  icon: Icon,
  colors,
  hasData,
  mark,
  tilt = 0,
  onOpen,
}: {
  title: string;
  icon: IconType;
  colors: TicketColors;
  hasData: boolean;
  mark?: ContributeKind | "none";
  tilt?: number;
  onOpen: () => void;
}) {
  const { body, stub } = colors;
  const ticket = (
    <span className={styles.frame}>
      <span className={styles.ticket} style={{ background: body.tint, color: body.textColor }}>
        <span className={styles.main}>
          {mark && mark !== "none" && hasData && (
            // Solid chip; outline in the ticket's text color separates it from a same-color ticket.
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
        </span>
        <span className={styles.perf} style={{ "--perf": body.textColor } as React.CSSProperties} aria-hidden />
        <span className={styles.stub} style={{ background: stub.tint, color: stub.textColor }}>
          <Icon className={styles.icon} aria-hidden />
        </span>
      </span>
    </span>
  );

  // Dark tickets (white text): white outline to match their perforation, ink-edged white shadow.
  const style = {
    "--tilt": `${tilt}deg`,
    ...(body.textColor === "#ffffff" ? { "--ink-edge": "#ffffff" } : {}),
  } as React.CSSProperties;
  return hasData ? (
    <button className={`${styles.card} ${styles.open}`} style={style} onClick={onOpen}>
      {ticket}
      <span className={styles.pin} aria-hidden />
    </button>
  ) : (
    <div className={`${styles.card} ${styles.empty}`} style={style}>
      {ticket}
      <span className={styles.pin} aria-hidden />
    </div>
  );
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
    "--page-bg": page.tint,
    "--page-ink": page.textColor,
    "--page-ink-soft": withAlpha(page.textColor, 0.7),
  } as React.CSSProperties;
  return (
    <div className={styles.wrap} style={vars}>
      <div className={`tk-eyebrow ${styles.hint}`}>
        <span className={styles.touch}>TAP</span>
        <span className={styles.mouse}>CLICK</span> {contribute ? "TICKET TO ADD OR DISPUTE INFO" : "TICKET FOR DETAILS"}
      </div>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}
