import Link from "next/link";
import { tagStyle, type TagVariant } from "./linkTags";

// "Get involved" tag (links to /contribute). Variant matches the bar it sits on; see linkTags.
export default function ContributeLink({ variant = "outline" }: { variant?: TagVariant }) {
  return (
    <Link href="/contribute" className="tf-link" style={tagStyle(variant)}>
      GET INVOLVED
    </Link>
  );
}
