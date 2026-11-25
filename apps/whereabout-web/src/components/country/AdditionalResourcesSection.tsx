import { MdArrowOutward } from "react-icons/md";
import { cssVars } from "@/lib/color";
import section from "./Section.module.css";

// Generic, not per country.
export const RESOURCES: [string, string][] = [
  ["Google Translate", "https://translate.google.com"],
  ["Wikitravel", "https://wikitravel.org"],
  ["Radio Garden", "https://radio.garden"],
  ["OpenGuessr", "https://openguessr.com"],
];

export default function AdditionalResourcesSection({ accent }: { accent: string }) {
  return (
    <div className={section.accent} style={cssVars({ "--accent": accent })}>
      {RESOURCES.map(([label, url]) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${section.row} ${section.tallRow}`}
          data-umami-event="resource-link"
          data-umami-event-resource={label}
        >
          <span className={`row-title ${section.rowTitle} ${section.linkTitle}`}>{label}</span>
          <MdArrowOutward size={16} aria-hidden />
        </a>
      ))}
    </div>
  );
}
