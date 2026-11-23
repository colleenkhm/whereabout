"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { withAlpha, type SectionColors } from "@/lib/color";
import { monthAbbrev } from "@/lib/format";
import type { ExchangeRate, LanguageEntry } from "@/lib/types";
import ExternalLink from "../ExternalLink";
import { sortLanguages } from "./LanguageSection";
import styles from "./CountryHeader.module.css";

interface Props {
  isoCode: string;
  name: string;
  languages: LanguageEntry[];
  nativeNames: Record<string, string>;
  timezone: string | null;
  latitude: number | null;
  exchangeRate: ExchangeRate | null;
  currencyName: string | null;
  currencyCode: string | null;
  header: SectionColors;
  accent: string;
}

// Masthead: flag, name, then local time and currency.
export default function CountryHeader(p: Props) {
  const ink = p.header.textColor;
  const hasTime = p.timezone != null;
  const hasCurrency = p.currencyCode != null;
  return (
    <div
      className={styles.masthead}
      style={{ background: p.header.tint }}
    >
      <div className={styles.inner}>
        <div className={styles.titleCol}>
          <div className="tk-eyebrow" style={{ color: withAlpha(ink, 0.55) }}>
            DESTINATION
          </div>
          <h1 className={styles.name} style={{ color: ink }}>
            {p.name}
          </h1>
        </div>
        <div className={styles.flagCol}>
          <StampFlag isoCode={p.isoCode} label={nativeName(p.name, p.languages, p.nativeNames)} />
        </div>
        {(hasTime || hasCurrency) && (
          <div className={styles.facts} style={{ borderColor: withAlpha(ink, 0.2) }}>
            {hasTime && <LocalTimeFact timezone={p.timezone!} latitude={p.latitude} ink={ink} />}
            {hasCurrency && (
              <CurrencyFact rate={p.exchangeRate} currencyName={p.currencyName} currencyCode={p.currencyCode!} ink={ink} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Flag on a classic postage stamp: white paper, round-hole perforations. Sizes via CSS.
function StampFlag({ isoCode, label }: { isoCode: string; label: string }) {
  return (
    <div className={styles.stampShadow}>
      <div className={styles.stamp}>
        <Image
          className={styles.flag}
          src={`https://flagcdn.com/w160/${isoCode.toLowerCase()}.png`}
          alt=""
          width={68}
          height={46}
          unoptimized
        />
        <span className={styles.stampName}>
          {label}
        </span>
        <span className={`tk-eyebrow ${styles.stampCode}`}>{isoCode}</span>
      </div>
    </div>
  );
}

// Most-spoken non-English language with a native name; else first non-English; else English.
function nativeName(english: string, languages: LanguageEntry[], names: Record<string, string>): string {
  const local = Object.entries(names).filter(([lang]) => lang !== "English");
  const byRank = sortLanguages(languages).find((l) => local.some(([lang]) => lang === l.name));
  return (byRank && names[byRank.name]) ?? local[0]?.[1] ?? english;
}

function LocalTimeFact({ timezone, latitude, ink }: { timezone: string; latitude: number | null; ink: string }) {
  // Client-only clock (avoids a build-time time baked into HTML).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const local = now ? localTime(now, timezone) : null;
  const hemisphere =
    latitude == null ? null : latitude === 0 ? "On the Equator" : latitude > 0 ? "Northern Hemisphere" : "Southern Hemisphere";
  return (
    <div className={styles.timeFact}>
      <div className="tf-label" style={{ color: withAlpha(ink, 0.55) }}>
        LOCAL TIME
      </div>
      <DigitalClock hour={local?.hour ?? null} minute={local?.minute ?? null} ink={ink} />
      <div className={`tf-sub ${styles.timeSub}`} style={{ color: withAlpha(ink, 0.75) }}>
        {local && <div>{`${local.date} · ${local.utc}`}</div>}
        {hemisphere && <div>{hemisphere}</div>}
      </div>
    </div>
  );
}

// Minimal 12-hour digital readout in the masthead ink, with a blinking colon.
function DigitalClock({ hour, minute, ink }: { hour: number | null; minute: number | null; ink: string }) {
  const pad = (n: number | null) => (n == null ? "--" : String(n).padStart(2, "0"));
  const h12 = hour == null ? "--" : String(hour % 12 || 12);
  const period = hour == null ? "" : hour < 12 ? "AM" : "PM";
  return (
    <div
      className={styles.clock}
      style={{ color: ink, borderColor: withAlpha(ink, 0.35), background: withAlpha(ink, 0.06) }}
      role="img"
      aria-label={hour == null ? "Local time" : `Local time ${h12}:${pad(minute)} ${period}`}
    >
      <span>{h12}</span>
      <span className={styles.colon}>:</span>
      <span>{pad(minute)}</span>
      {period && <span className={styles.period}>{period}</span>}
    </div>
  );
}

// Rate printed on a minimal banknote: framed, code in the corner.
function CurrencyFact(p: { rate: ExchangeRate | null; currencyName: string | null; currencyCode: string; ink: string }) {
  const { rate, ink } = p;
  return (
    <div>
      <div className="tf-label" style={{ color: withAlpha(ink, 0.55) }}>
        $1 USD =
      </div>
      <div
        className={styles.bill}
        style={{
          color: ink,
          borderColor: withAlpha(ink, 0.45),
          background: withAlpha(ink, 0.06),
        }}
      >
        <span className={styles.billFrame} style={{ borderColor: withAlpha(ink, 0.25) }} aria-hidden />
        <span className={`tk-eyebrow ${styles.billCode}`} style={{ color: withAlpha(ink, 0.6) }} aria-hidden>
          {p.currencyCode}
        </span>
        <div className="tf-val">{rate ? rateLabel(rate) : "—"}</div>
        <div className="tf-sub" style={{ color: withAlpha(ink, 0.75) }}>
          {p.currencyName ?? "Daily rate"}
        </div>
      </div>
      {rate && (
        <div className="tf-sub" style={{ marginTop: 6 }}>
          <ExternalLink
            label="Convert"
            url={`https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=${rate.currencyCode}`}
            color={ink}
          />
        </div>
      )}
    </div>
  );
}

function localTime(now: Date, timeZone: string) {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        weekday: "short",
        month: "numeric",
        day: "numeric",
        timeZoneName: "longOffset",
      })
        .formatToParts(now)
        .map((x) => [x.type, x.value]),
    );
    // "GMT+05:30" -> "UTC+5:30"; "GMT" -> "UTC+0".
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(parts.timeZoneName ?? "");
    const utc = m ? `UTC${m[1]}${Number(m[2])}${m[3] === "00" ? "" : `:${m[3]}`}` : "UTC+0";
    return {
      time: `${parts.hour}:${parts.minute}`,
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      date: `${parts.weekday}, ${monthAbbrev(Number(parts.month) - 1)} ${parts.day}`,
      utc,
    };
  } catch {
    return null; // unrecognized IANA name
  }
}

// Four-figure rates read better with no decimal.
function rateLabel(r: ExchangeRate): string {
  const n = r.rateFromUsd >= 100 ? String(Math.round(r.rateFromUsd)) : r.rateFromUsd.toFixed(2);
  const symbol = ({ EUR: "€", GBP: "£", CRC: "₡" } as Record<string, string>)[r.currencyCode] ?? `${r.currencyCode} `;
  return symbol + n;
}
