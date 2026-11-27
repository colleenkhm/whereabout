"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { MdOutlineLuggage, MdOutlinePeople, MdOutlinePerson, MdOutlinePublic } from "react-icons/md";
import PaperTexture from "@/components/PaperTexture";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Stamp, { FlagStamp } from "@/components/Stamp";
import PostageSheet, { type SheetContent } from "@/components/country/PostageSheet";
import { cssVars } from "@/lib/color";
import { fetchCompanions, fetchFriendRequests, initialOf, type Companion, type FriendRequest } from "@/lib/friends";
import { fetchPublicProfile, profileHref, type PublicProfile } from "@/lib/profile";
import { themeOf } from "@/lib/themes";
import { fetchTrips, tripPhotoUrl, type Trip } from "@/lib/trips";
import type { CountrySummary } from "@/lib/types";
import { useAvatarUrl } from "./Avatar";
import CompanionsSheet from "./CompanionsSheet";
import RelationshipAction from "./RelationshipAction";
import ShareButton from "./ShareButton";
import TripForm from "./TripForm";
import styles from "./Profile.module.css";

interface Props {
  profileId: string;
  viewer: User | null;
  countries: CountrySummary[];
  postcardColors: Record<string, string[]>;
  // Own profile on /account: edit in place, plus the signed-in footer.
  onEdit?: () => void;
  footer?: React.ReactNode;
}

interface Data {
  profile: PublicProfile;
  trips: Trip[];
  companions: Companion[];
  requests: FriendRequest[];
}

// Traveler dashboard (#96): masthead, stats, companions, stamp filter, a postcard per trip.
export default function ProfileView({ profileId, viewer, countries, postcardColors, onEdit, footer }: Props) {
  // undefined: loading; null: failed; "missing": no such profile.
  const [data, setData] = useState<Data | null | "missing" | undefined>(undefined);
  const [filter, setFilter] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetContent | null>(null);

  const load = useCallback(() => fetchDashboard(profileId).then(setData), [profileId]);

  // Refetch on sign in / out: that changes what's visible.
  const viewerId = viewer?.id;
  useEffect(() => {
    let live = true;
    fetchDashboard(profileId).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [profileId, viewerId]);

  const names = useMemo(() => new Map(countries.map((c) => [c.isoCode, c.nameCommon])), [countries]);
  const loaded = data && data !== "missing" ? data : null;
  const theme = themeOf(loaded?.profile.theme);
  const colors = { tint: theme.main, textColor: "#fbf6ec", accentOnWhite: theme.main };
  const vars = cssVars({ "--main": theme.main, "--accent": theme.accent });

  const own = loaded?.profile.relationship === "self";
  const closeSheet = () => setSheet(null);

  const openTrip = (trip?: Trip) => {
    if (!viewer) return;
    setSheet({
      title: trip ? "Edit trip" : "Where to next?",
      icon: MdOutlineLuggage,
      colors,
      body: (
        <TripForm
          key={trip?.id ?? "new"}
          userId={viewer.id}
          trip={trip}
          countries={countries}
          onDone={() => {
            closeSheet();
            load();
          }}
        />
      ),
    });
  };

  const openCompanions = () => {
    if (!loaded) return;
    setSheet({
      title: "Travel companions",
      icon: MdOutlinePeople,
      colors,
      body: (
        <CompanionsSheet
          userId={own ? viewer!.id : null}
          profileId={profileId}
          companions={loaded.companions}
          requests={loaded.requests}
          onChange={load}
        />
      ),
    });
  };

  return (
    <PaperTexture color={theme.accent}>
      <SiteHeader background={theme.accent} />
      <main className={styles.root} style={vars}>
        {data === undefined ? (
          <Message>Loading…</Message>
        ) : data === null ? (
          <Message error>Couldn&apos;t load this profile. Please refresh to try again.</Message>
        ) : data === "missing" ? (
          <Message>There&apos;s no profile at this link. Check it with the person who sent it.</Message>
        ) : (
          <Dashboard
            data={data}
            names={names}
            postcardColors={postcardColors}
            filter={filter}
            setFilter={setFilter}
            onEdit={onEdit}
            onTrip={own ? openTrip : undefined}
            onCompanions={openCompanions}
            onRelationshipChange={load}
            viewer={viewer}
          />
        )}
        {footer && <div className={styles.body}>{footer}</div>}
        {/* Inside main so the sheet gets the theme vars. */}
        <PostageSheet sheet={sheet} onClose={closeSheet} />
      </main>
      <SiteFooter />
    </PaperTexture>
  );
}

async function fetchDashboard(profileId: string): Promise<Data | null | "missing"> {
  const profile = await fetchPublicProfile(profileId);
  if (profile === undefined) return "missing";
  if (profile === null) return null;
  const self = profile.relationship === "self";
  const [trips, companions, requests] = await Promise.all([
    profile.canView ? fetchTrips(profileId) : [],
    profile.canView ? fetchCompanions(profileId) : [],
    self ? fetchFriendRequests() : [],
  ]);
  if (!trips || !companions || !requests) return null;
  return { profile, trips, companions, requests };
}

function Message({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div className={styles.body}>
      <p className={`s-body ${error ? "error-text" : ""}`} role={error ? "alert" : undefined}>
        {children}
      </p>
    </div>
  );
}

function Dashboard({
  data,
  names,
  postcardColors,
  filter,
  setFilter,
  onEdit,
  onTrip,
  onCompanions,
  onRelationshipChange,
  viewer,
}: {
  data: Data;
  names: Map<string, string>;
  postcardColors: Record<string, string[]>;
  filter: string | null;
  setFilter: (iso: string | null) => void;
  onEdit?: () => void;
  onTrip?: (trip?: Trip) => void;
  onCompanions: () => void;
  onRelationshipChange: () => void;
  viewer: User | null;
}) {
  const { profile, trips, companions, requests } = data;
  const own = profile.relationship === "self";
  const avatar = useAvatarUrl(profile.avatarPath);
  const incoming = requests.filter((r) => r.direction === "incoming").length;

  // Trip countries, most recent first.
  const tripCountries = useMemo(() => [...new Set(trips.flatMap((t) => t.countryIds))], [trips]);
  const active = filter && tripCountries.includes(filter) ? filter : null;
  const shown = active ? trips.filter((t) => t.countryIds.includes(active)) : trips;
  const grounds = useMemo(() => groundsFor(trips, postcardColors), [trips, postcardColors]);
  const years = groupByYear(shown);

  return (
    <>
      <section className={styles.masthead}>
        <div className={`${styles.inner} ${styles.mastRow}`}>
          <div>
            <div className={`tk-eyebrow ${styles.eyebrow}`}>TRAVELER</div>
            <h1 className={styles.name}>{profile.displayName ?? "Traveler"}</h1>
            {profile.homeBase && <div className={`tf-sub ${styles.homeBase}`}>Home base: {profile.homeBase}</div>}
            <div className={styles.mastActions}>
              {own ? (
                <>
                  <ShareButton profileId={profile.id} />
                  {onEdit ? (
                    <button type="button" className={styles.ghost} onClick={onEdit}>
                      EDIT PROFILE
                    </button>
                  ) : (
                    <Link href="/account" className={styles.ghost}>
                      EDIT PROFILE
                    </Link>
                  )}
                </>
              ) : (
                <RelationshipAction profile={profile} viewer={viewer} onChange={onRelationshipChange} />
              )}
            </div>
          </div>
          <Stamp
            fill
            art={
              avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" />
              ) : (
                <MdOutlinePerson size={34} className={styles.photoIcon} aria-hidden />
              )
            }
          />
        </div>
      </section>

      {profile.canView ? (
        <>
          <div className={styles.stats}>
            {count(profile.visitedCount, "COUNTRY", "COUNTRIES")} · {count(profile.tripCount, "TRIP", "TRIPS")} ·{" "}
            {count(profile.friendCount, "FRIEND", "FRIENDS")}
          </div>

          <div className={styles.body}>
            <section>
              <div className={styles.sectionHead}>
                <h2 className="tk-eyebrow">TRAVEL COMPANIONS</h2>
                {(companions.length > 0 || own) && (
                  <button type="button" className={styles.textButton} onClick={onCompanions}>
                    {incoming > 0 ? `SEE ALL · ${incoming} NEW` : own && companions.length === 0 ? "INVITE" : "SEE ALL"}
                  </button>
                )}
              </div>
              {companions.length > 0 ? (
                <ul className={styles.circles}>
                  {companions.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <CompanionCircle companion={c} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`s-body ${styles.empty}`}>
                  {own ? "No companions yet. Send someone your link to add each other." : "No companions to show."}
                </p>
              )}
            </section>

            {tripCountries.length > 0 && (
              <section>
                <h2 className={`tk-eyebrow ${styles.sectionHead}`}>TAP A STAMP TO FILTER</h2>
                <ul className={styles.stamps}>
                  <li>
                    <button
                      type="button"
                      className={styles.stampButton}
                      aria-pressed={active === null}
                      onClick={() => setFilter(null)}
                    >
                      <Stamp
                        outlined={active === null}
                        label="All trips"
                        code={`${trips.length}`}
                        art={<MdOutlinePublic size={30} className={styles.allIcon} aria-hidden />}
                      />
                    </button>
                  </li>
                  {tripCountries.map((iso) => (
                    <li key={iso}>
                      <button
                        type="button"
                        className={styles.stampButton}
                        aria-pressed={active === iso}
                        onClick={() => setFilter(active === iso ? null : iso)}
                      >
                        <FlagStamp isoCode={iso} label={names.get(iso) ?? iso} outlined={active === iso} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {years.map(([year, list]) => (
              <section key={year}>
                <h2 className={`tk-eyebrow ${styles.year}`}>{year}</h2>
                <div className={styles.cards}>
                  {list.map((t) => (
                    <div key={t.id}>
                      <Postcard trip={t} names={names} grounds={grounds.get(t.id) ?? []} onOpen={onTrip} />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {trips.length === 0 && !own && <p className={`s-body ${styles.empty}`}>No trips yet.</p>}

            {onTrip && (
              <button type="button" className={styles.next} onClick={() => onTrip()}>
                {trips.length === 0 ? "+ Add your first trip" : "+ Where to next?"}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className={styles.body}>
          <p className={`s-body ${styles.empty}`}>
            This profile is private. Travel companions can see {profile.displayName ? `${profile.displayName}'s` : "their"}{" "}
            trips.
          </p>
        </div>
      )}
    </>
  );
}

const count = (n: number | null, one: string, many: string) => `${n ?? 0} ${n === 1 ? one : many}`;

function CompanionCircle({ companion }: { companion: Companion }) {
  const url = useAvatarUrl(companion.avatarPath);
  return (
    <Link href={profileHref(companion.id)} className={styles.circle} title={companion.displayName ?? undefined}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={companion.displayName ?? ""} />
      ) : (
        <span aria-label={companion.displayName ?? undefined}>{initialOf(companion.displayName)}</span>
      )}
    </Link>
  );
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function Postcard({
  trip,
  names,
  grounds,
  onOpen,
}: {
  trip: Trip;
  names: Map<string, string>;
  grounds: string[];
  onOpen?: (trip: Trip) => void;
}) {
  const [y, m] = trip.startDate.split("-");
  const place = trip.countryIds.map((iso) => names.get(iso) ?? iso).join(" + ");
  const photo = usePhotoUrl(trip.photoPath);
  const inner = (
    <>
      <div className={styles.photo}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" />
        ) : (
          <span className={`tf-sub ${styles.photoHint}`}>{onOpen ? "[Add a trip photo]" : "[Trip photo]"}</span>
        )}
        <span className={styles.cardStamps}>
          {trip.countryIds.slice(0, 3).map((iso) => (
            <FlagStamp key={iso} isoCode={iso} size="sm" />
          ))}
        </span>
      </div>
      <div className={styles.cardFoot}>
        <div>
          <div className={`tk-eyebrow ${styles.greetings}`}>GREETINGS FROM</div>
          <div className={styles.place}>{place}</div>
          {trip.name && <div className={`tf-sub ${styles.tripName}`}>{trip.name}</div>}
        </div>
        <div className={styles.postmark} aria-label={`${MONTHS[Number(m) - 1]} ${y}`}>
          <span>{MONTHS[Number(m) - 1]}</span>
          <span>{y}</span>
        </div>
      </div>
    </>
  );
  const style = cssVars({ "--ground": groundCss(grounds) });
  return onOpen ? (
    <button type="button" className={styles.postcard} style={style} onClick={() => onOpen(trip)} aria-label={`Edit trip: ${place}, ${MONTHS[Number(m) - 1]} ${y}`}>
      {inner}
    </button>
  ) : (
    <article className={styles.postcard} style={style}>
      {inner}
    </article>
  );
}

function usePhotoUrl(path: string | null): string | null {
  const [url, setUrl] = useState<{ path: string; url: string } | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    tripPhotoUrl(path).then((u) => live && u && setUrl({ path, url: u }));
    return () => {
      live = false;
    };
  }, [path]);
  return path && url?.path === path ? url.url : null;
}

// One flag color per country; repeat visits step through the flag's colors.
function groundsFor(trips: Trip[], all: Record<string, string[]>): Map<string, string[]> {
  const seen = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const t of [...trips].reverse()) {
    out.set(
      t.id,
      t.countryIds.map((iso) => {
        const options = all[iso]?.length ? all[iso] : ["#1a1520"];
        const n = seen.get(iso) ?? 0;
        seen.set(iso, n + 1);
        return options[n % options.length];
      }),
    );
  }
  return out;
}

// Several countries: slanted bands, like the mockup's Spain + Portugal.
function groundCss(colors: string[]): string {
  if (colors.length <= 1) return colors[0] ?? "#1a1520";
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${(i * step).toFixed(1)}% ${((i + 1) * step).toFixed(1)}%`);
  return `linear-gradient(105deg, ${stops.join(", ")})`;
}

function groupByYear(trips: Trip[]): [string, Trip[]][] {
  const out: [string, Trip[]][] = [];
  for (const t of trips) {
    const year = t.startDate.slice(0, 4);
    const last = out[out.length - 1];
    if (last && last[0] === year) last[1].push(t);
    else out.push([year, [t]]);
  }
  return out;
}
