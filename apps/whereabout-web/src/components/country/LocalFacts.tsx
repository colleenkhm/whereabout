"use client";

import { useEffect, useState } from "react";
import { monthAbbrev } from "@/lib/format";
import type { ExchangeRate } from "@/lib/types";
import SectionSource from "./SectionSource";
import styles from "./LocalFacts.module.css";

export interface LocalFactsProps {
  timezone: string | null;
  exchangeRate: ExchangeRate | null;
  currencyName: string | null;
  currencyCode: string | null;
}

// Airport-board strip. Mobile: DETAILS under the left, CONVERT under the right. Wider: one line, no DETAILS.
export function DeparturesBar(p: LocalFactsProps & { onOpen: () => void }) {
  const now = useNow();
  const local = now && p.timezone ? localTime(now, p.timezone) : null;
  const parts = [
    ...(p.timezone != null
      ? [
          local ? (
            <span key="d">
              <span className={styles.narrowOnly}>{`${local.weekday} ${local.month} ${local.day}`}</span>
              <span className={styles.wideOnly}>{local.longDay}</span>
            </span>
          ) : (
            "--- --- --"
          ),
          <span key="t">
            <Clock local={local} />
            {local && <span className={styles.desktopOnly}> ({local.utc})</span>}
          </span>,
        ]
      : []),
    ...(p.currencyCode != null
      ? [
          <span key="c">
            {p.exchangeRate ? `$1 USD = ${rateLabel(p.exchangeRate)}` : `$1 USD = ${p.currencyCode} —`}
            {p.currencyName && <span className={styles.desktopOnly}> ({p.currencyName})</span>}
          </span>,
        ]
      : []),
  ];
  const rate = p.exchangeRate;
  // Mobile: full-cover button opens details; CONVERT is a real link stacked above it.
  // Tablet and up: no sheet, UTC offset inline instead.
  return (
    <div className={styles.board}>
      <button className={styles.cover} onClick={p.onOpen} aria-label="Local time and currency details" />
      <div className={styles.boardInner}>
        <span className={styles.line}>
          {parts.map((part, i) => (
            <span key={i} className={styles.part}>
              {part}
            </span>
          ))}
        </span>
        <span className={styles.actions}>
          <span className={styles.more} aria-hidden>
            DETAILS +
          </span>
          {rate && (
            <a
              className={styles.convert}
              href={`https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=${rate.currencyCode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              CONVERT ↗
            </a>
          )}
        </span>
      </div>
    </div>
  );
}

// Sheet body: full date and time, offset from the viewer, rate both ways and common amounts.
export function LocalDetails(p: LocalFactsProps & { accent: string }) {
  const now = useNow();
  const local = now && p.timezone ? localTime(now, p.timezone) : null;
  const rate = p.exchangeRate;
  return (
    <div className={styles.details}>
      {p.timezone != null && (
        <section>
          <div className="s-label">LOCAL TIME</div>
          <div className={styles.bigTime}>
            <Clock local={local} />
          </div>
          <div className="s-head">{local?.longDate ?? " "}</div>
          <div className="row-meta" style={{ marginTop: 4 }}>
            {local ? [local.zoneName, local.utc].filter(Boolean).join(" · ") : " "}
          </div>
          {local && now && <div className="row-meta">{offsetFromViewer(local.offsetMinutes, now)}</div>}
        </section>
      )}
      {p.currencyCode != null && (
        <section>
          <div className="s-label">CURRENCY</div>
          <div className="s-head" style={{ marginTop: 5 }}>
            {[p.currencyName, p.currencyCode].filter(Boolean).join(" · ")}
          </div>
          {rate ? (
            <>
              <div className={styles.rates}>
                <span>$1 USD = {rateLabel(rate)}</span>
                <span>{inverseLabel(rate)}</span>
              </div>
              <table className={styles.table}>
                <tbody>
                  {[5, 10, 20, 50, 100].map((usd) => (
                    <tr key={usd}>
                      <td>${usd}</td>
                      <td>{amountLabel(rate, usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SectionSource
                notes={[`Rate updated ${new Date(rate.fetchedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`]}
                links={[["Convert", `https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=${rate.currencyCode}`]]}
                color={p.accent}
              />
            </>
          ) : (
            <div className="row-meta" style={{ marginTop: 6 }}>
              Live rate unavailable right now.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// Client-only clock (avoids a build-time time baked into HTML).
function useNow(): Date | null {
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
  return now;
}

// 12-hour readout with a blinking colon.
function Clock({ local }: { local: LocalTime | null }) {
  const hour = local?.hour ?? null;
  const minute = local?.minute ?? null;
  const pad = (n: number | null) => (n == null ? "--" : String(n).padStart(2, "0"));
  const h12 = hour == null ? "--" : String(hour % 12 || 12);
  const period = hour == null ? "" : hour < 12 ? "AM" : "PM";
  return (
    <span aria-label={hour == null ? "Local time" : `${h12}:${pad(minute)} ${period}`}>
      {h12}
      <span className={styles.colon}>:</span>
      {pad(minute)}
      {period && <span className={styles.period}>{period}</span>}
    </span>
  );
}

type LocalTime = NonNullable<ReturnType<typeof localTime>>;

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
    const offsetMinutes = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
    const longDate = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(now);
    // "TUESDAY, NOVEMBER 24" for wider screens.
    const longDay = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "long", day: "numeric" })
      .format(now)
      .toUpperCase();
    const zoneName =
      new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "long" })
        .formatToParts(now)
        .find((x) => x.type === "timeZoneName")?.value ?? null;
    return {
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      month: monthAbbrev(Number(parts.month) - 1).toUpperCase(),
      day: Number(parts.day),
      weekday: (parts.weekday ?? "").toUpperCase(),
      longDate,
      longDay,
      // Skip names that are just the offset again ("GMT+12").
      zoneName: zoneName && !/^GMT/.test(zoneName) ? zoneName : null,
      utc,
      offsetMinutes,
    };
  } catch {
    return null; // unrecognized IANA name
  }
}

// "17 hours ahead of you", "5 hours 30 min behind you", "Same time as you".
function offsetFromViewer(zoneMinutes: number, now: Date): string {
  const diff = zoneMinutes + now.getTimezoneOffset();
  if (diff === 0) return "Same time as you";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const min = abs % 60;
  const span = [h ? `${h} hour${h === 1 ? "" : "s"}` : "", min ? `${min} min` : ""].filter(Boolean).join(" ");
  return `${span} ${diff > 0 ? "ahead of" : "behind"} you`;
}

const SYMBOLS: Record<string, string> = { EUR: "€", GBP: "£", CRC: "₡" };
const prefix = (code: string) => SYMBOLS[code] ?? `${code} `;
const num = (n: number, digits: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Four-figure rates read better with no decimal.
function rateLabel(r: ExchangeRate): string {
  return prefix(r.currencyCode) + num(r.rateFromUsd, r.rateFromUsd >= 100 ? 0 : 2);
}

function amountLabel(r: ExchangeRate, usd: number): string {
  const v = r.rateFromUsd * usd;
  return prefix(r.currencyCode) + num(v, v >= 100 ? 0 : 2);
}

// Weak currencies: quote a round local amount so the USD side isn't 0.00.
function inverseLabel(r: ExchangeRate): string {
  const base = r.rateFromUsd >= 100 ? 10 ** Math.floor(Math.log10(r.rateFromUsd)) : 1;
  return `${prefix(r.currencyCode)}${num(base, 0)} = $${num(base / r.rateFromUsd, 2)} USD`;
}
