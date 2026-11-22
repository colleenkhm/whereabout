import Link from "next/link";

// Credit line + Sources link (licenses need it findable everywhere).
export default function SiteFooter() {
  const style = { fontFamily: "var(--dm-mono)", fontSize: 10.5, color: "rgba(107, 101, 120, 0.7)" };
  return (
    <footer style={{ ...style, padding: "24px 0", textAlign: "center" }}>
      built by Colleen Murray&nbsp;&nbsp;·&nbsp;&nbsp;
      <Link href="/about/" style={{ textDecoration: "underline" }}>
        Sources &amp; credits
      </Link>
    </footer>
  );
}
