import { formatShortDate } from "@/lib/format";
import type { VisaInfo } from "@/lib/types";
import ExternalLink from "../ExternalLink";
import SectionSource from "./SectionSource";
import section from "./Section.module.css";
import styles from "./VisaSection.module.css";

const STATE_DEPT_INDEX =
  "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages.html";

// Free-text summary only; never an invented headline.
export default function VisaSection({
  visa,
  accent,
  stateDeptUrl,
}: {
  visa: VisaInfo | null;
  accent: string;
  stateDeptUrl: string | null;
}) {
  if (!visa) {
    return (
      <p className={`s-body ${section.message}`}>
        No visa information available at this time. Check the{" "}
        <ExternalLink label="US State Department" url={stateDeptUrl ?? STATE_DEPT_INDEX} color={accent} /> for the
        latest information.
      </p>
    );
  }

  const prohibited = visa.prohibitedOnEntry || visa.prohibitedOnExit;
  return (
    <div className={section.pad}>
      <div className="s-label">{visa.issuingAuthority}</div>
      <div className={`s-head ${section.headline}`}>
        For {visa.nationalityIsoCode} passport holders
      </div>
      <p className={`s-body ${section.lead}`}>
        {visa.summary}
      </p>
      {visa.applicationUrl && (
        <div className={styles.apply}>
          <ExternalLink label="Apply" url={visa.applicationUrl} color={accent} />
        </div>
      )}
      {prohibited && (
        <div className={styles.prohibited}>
          {visa.prohibitedOnEntry && <Prohibited label="Declare on entry" body={visa.prohibitedOnEntry} />}
          {visa.prohibitedOnExit && <Prohibited label="Declare on exit" body={visa.prohibitedOnExit} />}
        </div>
      )}
      <SectionSource
        notes={[`Visa & entry info verified ${formatShortDate(visa.lastVerifiedAt)}`]}
        links={[["Source", visa.officialUrl]]}
        color={accent}
      />
    </div>
  );
}

function Prohibited({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="s-label error-text">
        {label.toUpperCase()}
      </div>
      <p className={`s-body ${styles.declare}`}>
        {body}
      </p>
    </div>
  );
}
