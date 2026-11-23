"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { readableTextColor, withAlpha, type SectionColors } from "@/lib/color";
import { monthAbbrev } from "@/lib/format";
import type { ExchangeRate, LanguageEntry } from "@/lib/types";
import ExternalLink from "../ExternalLink";
import SiteHeader from "../SiteHeader";
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
  nav: string;
  // Clock and bill face: the muted page color.
  fill: string;
}

// Masthead: flag, name, then local time and currency.
// Logo row + masthead stick at every size. Mobile: facts scroll away below. Desktop: one row,
// or name/stamp over a facts row when they don't all fit.
// Colors: mobile is color 1 / color 2 / color 1 (logo row, masthead, facts strip);
// desktop is color 2 / color 1, so color 1 always has the most area.
export default function CountryHeader(p: Props) {
  const ink = p.header.textColor;
  const hasFacts = p.timezone != null || p.currencyCode != null;
  // Hidden with the facts (contribute mode).
  const hemisphere = hasFacts ? hemisphereOf(p.latitude) : null;
  const colors = {
    "--c1": p.header.tint,
    "--c1-ink": ink,
    "--c2": p.nav,
    "--c2-ink": readableTextColor(p.nav),
  } as React.CSSProperties;
  const { innerRef, titleRef, slotRef, flagRef, stacked } = useStackWhenCrowded(
    [p.name, p.exchangeRate],
  );
  return (
    <>
      <div className={styles.sticky} style={colors}>
        {/* Logo row renders once per layout; CSS shows one. */}
        <div className={styles.mobileOnly}>
          <SiteHeader background={p.header.tint} />
        </div>
        <div className={styles.desktopOnly}>
          <SiteHeader background={p.nav} />
        </div>
        <div className={styles.masthead}>
          <div
            ref={innerRef}
            className={`${styles.inner} ${stacked ? styles.stacked : ""}`}
          >
            <div ref={titleRef} className={styles.titleCol}>
              <div className={`tk-eyebrow ${styles.eyebrow}`}>DESTINATION</div>
              <h1 className={styles.name}>{p.name}</h1>
              {hemisphere && (
                <div className={`tf-sub ${styles.hemisphere}`}>
                  {hemisphere}
                </div>
              )}
            </div>
            <div ref={slotRef} className={styles.desktopFacts}>
              {hasFacts && <Facts {...p} ink={ink} />}
            </div>
            <div ref={flagRef} className={styles.flagCol}>
              <StampFlag
                isoCode={p.isoCode}
                label={nativeName(p.name, p.languages, p.nativeNames)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Facts render in both slots; CSS shows one per layout. */}
      {hasFacts && (
        <div
          className={styles.mobileFacts}
          style={{ background: p.header.tint }}
        >
          <div className={styles.mobileFactsInner}>
            <Facts {...p} ink={ink} />
          </div>
        </div>
      )}
    </>
  );
}

// Facts area needs at least this much to use the side-by-side layout (matches the CSS container query).
const MIN_FACTS = 560;

// Desktop: true when name, every fact box and the stamp can't share one row with a gap
// at each end, so the facts drop to their own row under the name and stamp.
function useStackWhenCrowded(deps: unknown[]) {
  const inner = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const flag = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);
  useLayoutEffect(() => {
    const els = [inner.current, title.current, slot.current, flag.current];
    if (els.some((el) => !el)) return;
    const [innerEl, titleEl, slotEl, flagEl] = els as HTMLDivElement[];
    const measure = () => {
      if (getComputedStyle(slotEl).display === "none") return;
      const facts = slotEl.firstElementChild;
      if (!facts) return;
      // Flex items, looking through display: contents wrappers.
      const items = [...facts.children].flatMap((c) =>
        getComputedStyle(c).display === "contents" ? [...c.children] : [c],
      ) as HTMLElement[];
      const gap = parseFloat(getComputedStyle(facts).columnGap) || 0;
      const needed =
        items.reduce((w, el) => w + el.offsetWidth, 0) +
        gap * (items.length + 1);
      const available =
        innerEl.clientWidth -
        titleEl.offsetWidth -
        flagEl.offsetWidth -
        (parseFloat(getComputedStyle(flagEl).marginLeft) || 0);
      setStacked(available < Math.max(needed, MIN_FACTS + gap));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(innerEl);
    ro.observe(titleEl);
    document.fonts?.ready.then(measure);
    measure();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return {
    innerRef: inner,
    titleRef: title,
    slotRef: slot,
    flagRef: flag,
    stacked,
  };
}

function Facts(p: Props & { ink: string }) {
  const { ink } = p;
  return (
    <div
      className={styles.facts}
      style={{ "--fact-shadow": ink } as React.CSSProperties}
    >
      {p.timezone != null && (
        <LocalTimeFact timezone={p.timezone} ink={ink} fill={p.fill} />
      )}
      {p.currencyCode != null && (
        <CurrencyFact
          rate={p.exchangeRate}
          currencyName={p.currencyName}
          currencyCode={p.currencyCode}
          ink={ink}
          fill={p.fill}
        />
      )}
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
        <span className={styles.stampName}>{label}</span>
        <span className={`tk-eyebrow ${styles.stampCode}`}>{isoCode}</span>
      </div>
    </div>
  );
}

// Most-spoken non-English language with a native name; else first non-English; else English.
function nativeName(
  english: string,
  languages: LanguageEntry[],
  names: Record<string, string>,
): string {
  const local = Object.entries(names).filter(([lang]) => lang !== "English");
  const byRank = sortLanguages(languages).find((l) =>
    local.some(([lang]) => lang === l.name),
  );
  return (byRank && names[byRank.name]) ?? local[0]?.[1] ?? english;
}

const hemisphereOf = (latitude: number | null) =>
  latitude == null
    ? null
    : latitude === 0
      ? "On the Equator"
      : latitude > 0
        ? "Northern Hemisphere"
        : "Southern Hemisphere";

function LocalTimeFact(p: { timezone: string; ink: string; fill: string }) {
  const { timezone, ink } = p;
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
  return (
    <div className={styles.timeRow}>
      <CalendarIcon
        month={local?.month ?? null}
        day={local?.day ?? null}
        weekday={local?.weekday ?? null}
        date={local?.date ?? null}
        fill={p.fill}
      />
      <div>
        <div className="tf-label" style={{ color: withAlpha(ink, 0.55) }}>
          LOCAL TIME
        </div>
        <div className={styles.clockWrap}>
          <DigitalClock
            hour={local?.hour ?? null}
            minute={local?.minute ?? null}
          />
        </div>
        <div
          className={`tf-sub ${styles.utc}`}
          style={{ color: withAlpha(ink, 0.75) }}
        >
          {local?.utc ?? "\u00a0"}
        </div>
      </div>
    </div>
  );
}

// Tear-off calendar: month band over the day and weekday, framed like the clock.
function CalendarIcon(p: {
  month: string | null;
  day: number | null;
  weekday: string | null;
  date: string | null;
  fill: string;
}) {
  const text = readableTextColor(p.fill);
  return (
    <div
      className={styles.calendar}
      style={{ color: text, background: p.fill }}
      role="img"
      aria-label={p.date ? `Local date ${p.date}` : "Local date"}
    >
      <span
        className={styles.calMonth}
        style={{ background: text, color: p.fill }}
      >
        {p.month ?? "---"}
      </span>
      <span className={styles.calDay}>
        {p.day ?? "--"}
        <span className={styles.calWeekday}>{p.weekday ?? "---"}</span>
      </span>
    </div>
  );
}

// Minimal 12-hour digital readout, white on ink, with a blinking colon.
function DigitalClock(p: { hour: number | null; minute: number | null }) {
  const { hour, minute } = p;
  const pad = (n: number | null) =>
    n == null ? "--" : String(n).padStart(2, "0");
  const h12 = hour == null ? "--" : String(hour % 12 || 12);
  const period = hour == null ? "" : hour < 12 ? "AM" : "PM";
  return (
    <div
      className={styles.clock}
      role="img"
      aria-label={
        hour == null
          ? "Local time"
          : `Local time ${h12}:${pad(minute)} ${period}`
      }
    >
      <span>{h12}</span>
      <span className={styles.colon}>:</span>
      <span>{pad(minute)}</span>
      {period && <span className={styles.period}>{period}</span>}
    </div>
  );
}

// Rate printed on a minimal banknote: framed, code in the corner.
// fill: muted page color, with readable (black) text and outline.
function CurrencyFact(p: {
  rate: ExchangeRate | null;
  currencyName: string | null;
  currencyCode: string;
  ink: string;
  fill: string;
}) {
  const { rate, ink, fill } = p;
  const text = readableTextColor(fill);
  return (
    <div className={styles.currencyFact}>
      <div className="tf-label" style={{ color: withAlpha(ink, 0.55) }}>
        $1 USD =
      </div>
      <div
        className={styles.bill}
        style={{
          color: text,
          background: fill,
        }}
      >
        <span
          className={styles.billFrame}
          style={{ borderColor: withAlpha(text, 0.3) }}
          aria-hidden
        />
        <span
          className={`tk-eyebrow ${styles.billCode}`}
          style={{ color: withAlpha(text, 0.7) }}
          aria-hidden
        >
          {p.currencyCode}
        </span>
        <div className="tf-val">{rate ? rateLabel(rate) : "—"}</div>
        <div className="tf-sub" style={{ color: withAlpha(text, 0.8) }}>
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
    const utc = m
      ? `UTC${m[1]}${Number(m[2])}${m[3] === "00" ? "" : `:${m[3]}`}`
      : "UTC+0";
    return {
      time: `${parts.hour}:${parts.minute}`,
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      date: `${parts.weekday}, ${monthAbbrev(Number(parts.month) - 1)} ${parts.day}`,
      month: monthAbbrev(Number(parts.month) - 1).toUpperCase(),
      day: Number(parts.day),
      weekday: (parts.weekday ?? "").toUpperCase(),
      utc,
    };
  } catch {
    return null; // unrecognized IANA name
  }
}

// Four-figure rates read better with no decimal.
function rateLabel(r: ExchangeRate): string {
  const n =
    r.rateFromUsd >= 100
      ? String(Math.round(r.rateFromUsd))
      : r.rateFromUsd.toFixed(2);
  const symbol =
    ({ EUR: "€", GBP: "£", CRC: "₡" } as Record<string, string>)[
      r.currencyCode
    ] ?? `${r.currencyCode} `;
  return symbol + n;
}
