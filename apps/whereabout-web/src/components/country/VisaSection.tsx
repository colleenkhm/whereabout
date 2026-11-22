import { formatShortDate } from "@/lib/format";
import type { VisaInfo } from "@/lib/types";
import ExternalLink from "../ExternalLink";
import SectionSource from "./SectionSource";

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
      <p className="s-body" style={{ padding: "18px 20px" }}>
        No visa information available at this time. Check the{" "}
        <ExternalLink label="US State Department" url={stateDeptUrl ?? STATE_DEPT_INDEX} color={accent} /> for the
        latest information.
      </p>
    );
  }

  const prohibited = visa.prohibitedOnEntry || visa.prohibitedOnExit;
  return (
    <div style={{ padding: "16px 20px" }}>
      <div className="s-label">{visa.issuingAuthority}</div>
      <div className="s-head" style={{ marginTop: 5 }}>
        For {visa.nationalityIsoCode} passport holders
      </div>
      <p className="s-body" style={{ marginTop: 6 }}>
        {visa.summary}
      </p>
      {visa.applicationUrl && (
        <div style={{ marginTop: 4, textAlign: "right" }}>
          <ExternalLink label="Apply" url={visa.applicationUrl} color={accent} />
        </div>
      )}
      {prohibited && (
        <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--rule)", display: "grid", gap: 8 }}>
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
      <div className="s-label" style={{ color: "var(--danger)" }}>
        {label.toUpperCase()}
      </div>
      <p className="s-body" style={{ marginTop: 3 }}>
        {body}
      </p>
    </div>
  );
}
