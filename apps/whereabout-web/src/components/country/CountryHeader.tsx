"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { withAlpha, type SectionColors } from "@/lib/color";
import { monthAbbrev } from "@/lib/format";
import type { ExchangeRate } from "@/lib/types";
import ExternalLink from "../ExternalLink";
import styles from "./CountryHeader.module.css";

interface Props {
  isoCode: string;
  name: string;
  timezone: string | null;
  latitude: number | null;
  exchangeRate: ExchangeRate | null;
  currencyName: string | null;
  currencyCode: string | null;
  header: SectionColors;
}

// Masthead: flag, name, then local time and currency.
export default function CountryHeader(p: Props) {
  const ink = p.header.textColor;
  const hasTime = p.timezone != null;
  const hasCurrency = p.currencyCode != null;
  return (
    <div className={styles.masthead} style={{ background: p.header.tint }}>
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
          <StampFlag isoCode={p.isoCode} />
        </div>
        {(hasTime || hasCurrency) && (
          <div className={styles.facts} style={{ borderColor: withAlpha(ink, 0.2) }}>
            {hasTime && <LocalTimeFact timezone={p.timezone!} latitude={p.latitude} ink={ink} />}
            {hasCurrency && <CurrencyFact rate={p.exchangeRate} currencyName={p.currencyName} ink={ink} />}
          </div>
        )}
      </div>
    </div>
  );
}

// Flag on a white perforated postage-stamp mat. Desktop size via CSS.
function StampFlag({ isoCode }: { isoCode: string }) {
  return (
    <div className={styles.stamp}>
      <svg className={styles.stampEdge} viewBox="0 0 62 46" preserveAspectRatio="none" aria-hidden>
        <path d={stampPath(62, 46)} fill="#fff" />
      </svg>
      <Image
        className={styles.flag}
        src={`https://flagcdn.com/w160/${isoCode.toLowerCase()}.png`}
        alt=""
        width={68}
        height={46}
        unoptimized
      />
    </div>
  );
}

// Zigzag outline: alternating baseline/outward points, 3px teeth.
function stampPath(w: number, h: number, tooth = 3): string {
  const l = tooth, t = tooth, r = w - tooth, b = h - tooth;
  const pts: [number, number][] = [[l, t]];
  const edge = (x0: number, y0: number, x1: number, y1: number, ox: number, oy: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.round(len / tooth));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      const x = x0 + (x1 - x0) * f;
      const y = y0 + (y1 - y0) * f;
      pts.push(i % 2 ? [x + ox * tooth, y + oy * tooth] : [x, y]);
    }
  };
  edge(l, t, r, t, 0, -1);
  edge(r, t, r, b, 1, 0);
  edge(r, b, l, b, 0, 1);
  edge(l, b, l, t, -1, 0);
  return "M" + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L") + "Z";
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
    <Fact label="LOCAL TIME" value={local?.time ?? "—"} ink={ink}>
      {local && <div>{`${local.date} · ${local.utc}`}</div>}
      {hemisphere && <div>{hemisphere}</div>}
    </Fact>
  );
}

function CurrencyFact({ rate, currencyName, ink }: { rate: ExchangeRate | null; currencyName: string | null; ink: string }) {
  return (
    <Fact label="$1 USD =" value={rate ? rateLabel(rate) : "—"} ink={ink}>
      <div>{currencyName ?? "Daily rate"}</div>
      {rate && (
        <div style={{ marginTop: 4 }}>
          <ExternalLink
            label="Convert"
            url={`https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=${rate.currencyCode}`}
            color={ink}
          />
        </div>
      )}
    </Fact>
  );
}

// Label, big value, then detail lines.
function Fact({ label, value, ink, children }: { label: string; value: string; ink: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="tf-label" style={{ color: withAlpha(ink, 0.55) }}>
        {label}
      </div>
      <div className="tf-val" style={{ marginTop: 4, color: ink }}>
        {value}
      </div>
      <div className="tf-sub" style={{ marginTop: 2, color: withAlpha(ink, 0.75) }}>
        {children}
      </div>
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
