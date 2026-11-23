import styles from "./BetaTag.module.css";

// "BETA" label. outline: beside the wordmark. filled: over the home flags; the white tags beside it are the links.
export default function BetaTag({ variant = "outline" }: { variant?: "outline" | "filled" }) {
  return <span className={`tf-link ${styles.tag} ${styles[variant]}`}>BETA</span>;
}
