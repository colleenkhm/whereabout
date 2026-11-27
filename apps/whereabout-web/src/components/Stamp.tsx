import Image from "next/image";
import styles from "./Stamp.module.css";

type Size = "md" | "sm";

// Classic postage stamp: white paper, round-hole perforations. Sizes via CSS.
// outlined: ink edge for a light background. fill: art covers the paper (no name/code).
export default function Stamp({
  art,
  label,
  code,
  size = "md",
  outlined = false,
  fill = false,
}: {
  art: React.ReactNode;
  label?: string;
  code?: string;
  size?: Size;
  outlined?: boolean;
  fill?: boolean;
}) {
  return (
    <span className={`${styles.shadow} ${outlined ? styles.outlined : ""}`}>
      <span className={`${styles.stamp} ${styles[size]} ${fill ? styles.fill : ""}`}>
        <span className={styles.art}>{art}</span>
        {label && size === "md" && <span className={styles.name}>{label}</span>}
        {code && size === "md" && <span className={`tk-eyebrow ${styles.code}`}>{code}</span>}
      </span>
    </span>
  );
}

// A country's flag on a stamp.
export function FlagStamp({
  isoCode,
  label,
  size = "md",
  outlined = false,
  showCode = true,
}: {
  isoCode: string;
  label?: string;
  size?: Size;
  outlined?: boolean;
  showCode?: boolean;
}) {
  return (
    <Stamp
      size={size}
      outlined={outlined}
      label={label}
      code={showCode ? isoCode : undefined}
      art={
        <Image
          className={styles.flagImage}
          src={`https://flagcdn.com/w160/${isoCode.toLowerCase()}.png`}
          alt=""
          width={68}
          height={46}
          unoptimized
        />
      }
    />
  );
}
