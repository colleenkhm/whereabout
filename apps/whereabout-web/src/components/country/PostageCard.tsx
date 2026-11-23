import type { IconType } from "react-icons";
import { withAlpha, type SectionColors, type TicketColors } from "@/lib/color";
import styles from "./PostageCard.module.css";

// Small alternating tilt so the grid reads hand-placed.
export const POSTAGE_TILTS = [-0.6, 0.5, -0.4, 0.6, -0.5, 0.4];

// Pinned admission ticket: title in the body's corner, icon on the stub. No data: muted, inert.
export default function PostageCard({
  title,
  icon: Icon,
  colors,
  hasData,
  tilt = 0,
  onOpen,
}: {
  title: string;
  icon: IconType;
  colors: TicketColors;
  hasData: boolean;
  tilt?: number;
  onOpen: () => void;
}) {
  const { body, stub } = colors;
  const ticket = (
    // Dark tickets (white text) get a white outline to match their perforation.
    <span
      className={styles.frame}
      style={body.textColor === "#ffffff" ? ({ "--ink-edge": "#ffffff" } as React.CSSProperties) : undefined}
    >
      <span className={styles.ticket} style={{ background: body.tint, color: body.textColor }}>
        <span className={styles.main}>
          <span className={`sec-name ${styles.title}`} style={{ color: body.textColor }}>
            {title}
          </span>
          {!hasData && (
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

  const style = { "--tilt": `${tilt}deg` } as React.CSSProperties;
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
export function PostageGrid({ page, children }: { page: SectionColors; children: React.ReactNode }) {
  const vars = {
    "--page-bg": page.tint,
    "--page-ink": page.textColor,
    "--page-ink-soft": withAlpha(page.textColor, 0.7),
  } as React.CSSProperties;
  return (
    <div className={styles.wrap} style={vars}>
      <div className={`tk-eyebrow ${styles.hint}`}>
        <span className={styles.touch}>TAP</span>
        <span className={styles.mouse}>CLICK</span> TICKET FOR DETAILS
      </div>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}
