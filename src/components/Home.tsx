import React, { useEffect, useMemo, useState } from 'react';
import { useThemeContext } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { Github, Linkedin } from 'lucide-react';
import leif from '../assets/Leif-Christian.png';
import background from '../assets/stock1.png';

// Must start after the global "page flip" load animation in `App.tsx` (1.5s).
const PAGE_LOAD_ANIMATION_MS = 1500;
const CINEMATIC_FADE_OUT_MS = 1100;
const MARQUEE_START_DELAY_MS = PAGE_LOAD_ANIMATION_MS + 500;
// ~25% slower per slide (gives the text room to breathe).
const MARQUEE_SLIDE_MS = 6500;
// Keep the redirect aligned so the full marquee sequence completes before we fade out.
const REDIRECT_MS = MARQUEE_START_DELAY_MS + MARQUEE_SLIDE_MS * 3 + 900;
let hasRunCinematicHomeToPortfolio = false;
const HOME_INTRO_DONE_KEY = 'lc_home_intro_done_v1';
const GITHUB_USERNAME = 'LeifChristian';
const GITHUB_CONTRIB_TOTAL_API_URL = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`;
const GITHUB_CONTRIB_CACHE_KEY = 'lc_gh_contrib_lastYear_payload_v1';
const GITHUB_CONTRIB_CACHE_TS_KEY = 'lc_gh_contrib_lastYear_payload_ts_v1';
const GITHUB_CONTRIB_TOTAL_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type GhContribDay = {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

function buildWeeks(days: GhContribDay[]) {
  if (!days.length) return { weeks: [] as (GhContribDay | null)[][] };
  const first = new Date(days[0].date + 'T00:00:00');
  const offset = first.getDay(); // 0=Sun..6=Sat
  const totalCells = offset + days.length;
  const weekCount = Math.ceil(totalCells / 7);
  const weeks: (GhContribDay | null)[][] = Array.from({ length: weekCount }, () =>
    Array.from({ length: 7 }, () => null)
  );
  for (let i = 0; i < days.length; i++) {
    const idx = offset + i;
    const w = Math.floor(idx / 7);
    const d = idx % 7;
    weeks[w][d] = days[i];
  }
  return { weeks };
}

const GH_DARK_GREENS: Record<GhContribDay['level'], string> = {
  0: 'transparent',
  1: '#0e4429',
  2: '#006d32',
  3: '#26a641',
  4: '#39d353',
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function getMonthLabelStarts(weeks: (GhContribDay | null)[][]) {
  const starts: { col: number; label: string }[] = [];
  let prevMonth: number | null = null;

  for (let col = 0; col < weeks.length; col++) {
    const week = weeks[col];
    const day = week.find(Boolean) as GhContribDay | undefined;
    if (!day) continue;
    const month = new Date(day.date + 'T00:00:00').getMonth();
    if (prevMonth === null || month !== prevMonth) {
      starts.push({ col, label: MONTHS_SHORT[month] });
      prevMonth = month;
    }
  }

  return starts;
}

export const Home: React.FC<{ previousPath?: string }> = ({ previousPath }) => {
  const navigate = useNavigate();
  const { darkMode } = useThemeContext();
  const [isCinematicExit, setIsCinematicExit] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(() => {
    const hasCompletedIntro = sessionStorage.getItem(HOME_INTRO_DONE_KEY) === '1';
    // Only show the GitHub block when returning from the Portfolio page (never on initial load/reload).
    return Boolean(hasCompletedIntro && previousPath === '/portfolio');
  });
  const [socialsVisible, setSocialsVisible] = useState(false);
  const [marqueeIdx, setMarqueeIdx] = useState(0);
  const [contribTotalLastYear, setContribTotalLastYear] = useState<number | null>(null);
  const [contribDays, setContribDays] = useState<GhContribDay[] | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState({
    width: window.innerWidth <= 360,
    height: window.innerHeight <= 600
  });

  const isMobile = isSmallScreen.width || isSmallScreen.height;
  const prefersReducedMotion = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  useEffect(() => {
    const hasCompletedIntro = sessionStorage.getItem(HOME_INTRO_DONE_KEY) === '1';
    setIsIntroDone(Boolean(hasCompletedIntro && previousPath === '/portfolio'));
  }, [previousPath]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen({
        width: window.innerWidth <= 360,
        height: window.innerHeight <= 600
      });
    };

    window.addEventListener('resize', handleResize);

    const shouldRunIntro = !prefersReducedMotion && !isIntroDone;
    const shouldRunCinematicOnce = shouldRunIntro && !hasRunCinematicHomeToPortfolio;

    let startFadeTimer: number | undefined;
    if (shouldRunCinematicOnce) {
      startFadeTimer = window.setTimeout(() => {
        setIsCinematicExit(true);
      }, Math.max(0, REDIRECT_MS - CINEMATIC_FADE_OUT_MS));
    }

    let redirectTimer: number | undefined;
    if (shouldRunIntro) {
      // Set up redirect timer (only for the initial intro)
      redirectTimer = window.setTimeout(() => {
        sessionStorage.setItem(HOME_INTRO_DONE_KEY, '1');

        if (shouldRunCinematicOnce) {
          hasRunCinematicHomeToPortfolio = true;
          navigate('/portfolio', { state: { cinematic: true, from: 'home-auto' } });
        } else {
          navigate('/portfolio');
        }
      }, REDIRECT_MS);
    }

    // Clean up timers and event listeners
    return () => {
      window.removeEventListener('resize', handleResize);
      if (startFadeTimer) clearTimeout(startFadeTimer);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isIntroDone, navigate, prefersReducedMotion]);

  useEffect(() => {
    if (isIntroDone) return;
    if (prefersReducedMotion) return;

    // Render a single slide at a time so links are clickable.
    setMarqueeIdx(0);
    let interval: number | undefined;
    const startTimer = window.setTimeout(() => {
      let idx = 0;
      interval = window.setInterval(() => {
        idx = (idx + 1) % 3;
        setMarqueeIdx(idx);
      }, MARQUEE_SLIDE_MS);
    }, MARQUEE_START_DELAY_MS);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [isIntroDone, prefersReducedMotion]);

  useEffect(() => {
    if (!isIntroDone) return;
    // Fade socials in on mount (static, no slide).
    const raf = requestAnimationFrame(() => setSocialsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [isIntroDone]);

  useEffect(() => {
    if (!isIntroDone) return;

    const now = Date.now();
    const cachedPayload = sessionStorage.getItem(GITHUB_CONTRIB_CACHE_KEY);
    const cachedTs = Number(sessionStorage.getItem(GITHUB_CONTRIB_CACHE_TS_KEY) || '0');
    if (cachedPayload && cachedTs && now - cachedTs < GITHUB_CONTRIB_TOTAL_CACHE_TTL_MS) {
      try {
        const parsed = JSON.parse(cachedPayload) as {
          total?: { lastYear?: number };
          contributions?: GhContribDay[];
        };
        const total = parsed?.total?.lastYear;
        if (typeof total === 'number' && Number.isFinite(total)) {
          setContribTotalLastYear(total);
        }
        if (Array.isArray(parsed?.contributions) && parsed.contributions.length) {
          setContribDays(parsed.contributions);
        }
        return;
      } catch {
        // fall through to refetch
      }
    }

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(GITHUB_CONTRIB_TOTAL_API_URL, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          total?: { lastYear?: number };
          contributions?: GhContribDay[];
        };
        const total = data?.total?.lastYear;
        if (typeof total === 'number' && Number.isFinite(total)) {
          setContribTotalLastYear(total);
        }
        if (Array.isArray(data?.contributions) && data.contributions.length) {
          setContribDays(data.contributions);
        }
        sessionStorage.setItem(GITHUB_CONTRIB_CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(GITHUB_CONTRIB_CACHE_TS_KEY, String(Date.now()));
      } catch {
        // ignore (offline / blocked / aborted)
      }
    })();

    return () => controller.abort();
  }, [isIntroDone]);

  // Rest of the component remains the same...
  const containerStyle: React.CSSProperties = {
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: isMobile ? 'scroll' : 'fixed',
    // Fill the available <main> height (avoid vertical scroll-jank)
    height: '100%',
    minHeight: '100%',
    // Full-bleed background even when Home is rendered inside a centered "container"
    width: '100vw',
    marginLeft: 'calc(50% - 50vw)',
    position: 'relative',
    overflow: 'hidden'
  };

  const avatarHeightClass = isSmallScreen.height
    ? 'h-[22vh]'
    : isSmallScreen.width
      ? 'h-[26vh]'
      : 'h-[34vh]';

      const marqueeSlides: React.ReactNode[] = [
        <>
          Hi, I’m Leif Christian — a frontend-focused full-stack engineer working with{' '}
          <span className="whitespace-nowrap">React and TypeScript</span>.
          <br />
          I build real-time, data-heavy interfaces that stay performant under constant change.
        </>,
        <>
          I currently lead development at{' '}
          <a
            href="https://sos-tech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:text-sky-200 no-underline font-medium whitespace-nowrap"
          >
            SOS Technologies
          </a>{' '}
          on our real-time incident platform.
          <br />
          I focus on integration-heavy, event-driven UI that reflects live system state.
        </>,
        <>
          I build full-stack applications across web, mobile and desktop using React, Next.js, React Native / Expo and Node.js, focused on API-driven and integration-heavy systems.
        </>,
      ];

  return (
    <div className="relative w-full h-full">
      <div style={containerStyle}>
        {/* Dark overlay for readability (keeps background image full-bleed) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 ${
            darkMode ? 'bg-black/70' : 'bg-black/55'
          }`}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/80"
        />
        {/* Cinematic fade-to-black (only for initial auto-redirect) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[1000] bg-black transition-opacity"
          style={{
            opacity: isCinematicExit ? 1 : 0,
            transitionDuration: `${CINEMATIC_FADE_OUT_MS}ms`,
            transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        />

        <div
          className={`relative mx-auto flex h-full w-full flex-col items-center justify-between ${
            isMobile ? 'px-4' : 'px-6'
          }`}
          style={{
            // Symmetric top/bottom padding: gives equal "air" above name and below bottom block.
            // Bumped up so the name/bottom block aren't hugging the edges.
            paddingTop: isMobile ? 24 : 36,
            paddingBottom: isMobile ? 24 : 36,
          }}
        >
          {/* Top: name */}
          <div>
            <h2 className="home-hero-text-glow font-grotesk text-white text-[26px] sm:text-[32px] md:text-[40px] leading-none font-normal tracking-wide text-center">
              Leif Christian
            </h2>
          </div>

          {/* Middle: avatar */}
          <div className="flex flex-1 items-center justify-center">
            <div
              className={`${avatarHeightClass} w-auto ${
                darkMode
                  ? 'drop-shadow-[0_10px_18px_rgba(255,255,255,0.75)]'
                  : 'drop-shadow-[0_10px_24px_rgba(0,0,0,0.65)]'
              }`}
            >
              <img
                src={leif}
                alt="Leif Christian"
                className="h-full w-auto object-contain"
              />
            </div>
          </div>

          {/* Bottom: marquee (intro) OR socials (after intro) */}
          <div className="w-full pb-0">
            {!isIntroDone ? (
              <div className="mx-auto w-full max-w-[1400px]">
                <div className="relative mx-auto h-[10.5rem] sm:h-[10.75rem] md:h-[11.5rem] overflow-hidden flex items-center justify-center">
                  <div
                    key={`marquee-${marqueeIdx}`}
                    className="home-marquee-line absolute inset-0 flex items-center justify-center text-center"
                    style={{
                      animationDuration: `${MARQUEE_SLIDE_MS}ms`,
                      // Fade-in the very first marquee line instead of appearing instantly.
                      animationDelay: marqueeIdx === 0 ? `${MARQUEE_START_DELAY_MS}ms` : '0ms',
                    }}
                  >
                    <div className="home-hero-text-glow mx-auto max-w-[72ch] px-4 whitespace-pre-line text-center [text-wrap:pretty] font-grotesk text-[20px] sm:text-[27px] md:text-[32px] leading-snug font-normal tracking-wide text-white">
                      {marqueeSlides[marqueeIdx]}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-4 transition-opacity duration-700 ${
                  socialsVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Reserve space so the layout doesn't jump while contributions load */}
                <div className="w-full flex flex-col items-center justify-center gap-3 min-h-[220px]">
                  <div className="min-h-[26px]">
                    {contribTotalLastYear != null ? (
                      <div className="home-hero-text-glow font-mono text-white/90 text-[20px] sm:text-[22px] tracking-wide">
                        {contribTotalLastYear.toLocaleString()} contributions (last year)
                      </div>
                    ) : (
                      <div className="font-mono text-[20px] sm:text-[22px] tracking-wide text-white/25 select-none">
                        Loading contributions…
                      </div>
                    )}
                  </div>

                  <div
                    className="group drop-shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
                    style={{
                      width: 'min(780px, 94vw)',
                      maxWidth: 780,
                      // Avoid clipping hover outlines / 3D tilt at the edges.
                      overflow: 'visible',
                      paddingLeft: 8,
                      paddingRight: 8,
                    }}
                    aria-label="GitHub contributions heatmap"
                  >
                    {contribDays?.length ? (
                      (() => {
                        const CELL = 12;
                        const GAP = 3;
                        const { weeks } = buildWeeks(contribDays);
                        const weekCount = weeks.length;
                        const monthStarts = getMonthLabelStarts(weeks);
                        const LEFT_LABEL_W = 26;

                        return (
                          <div
                            className="mx-auto transform-gpu transition-transform duration-200 ease-out will-change-transform group-hover:[transform:perspective(900px)_rotateX(18deg)]"
                            style={{ width: 'fit-content', transformOrigin: 'center' }}
                          >
                            {/* Month labels (top) */}
                            <div
                              aria-hidden="true"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: `${LEFT_LABEL_W}px repeat(${weekCount}, ${CELL}px)`,
                                columnGap: GAP,
                                alignItems: 'center',
                                marginBottom: 6,
                              }}
                            >
                              <div />
                              <div
                                style={{
                                  gridColumn: '2 / -1',
                                  display: 'grid',
                                  gridTemplateColumns: `repeat(${weekCount}, ${CELL}px)`,
                                  columnGap: GAP,
                                  alignItems: 'center',
                                }}
                              >
                                {monthStarts.map(({ col, label }) => (
                                  <div
                                    key={`${label}-${col}`}
                                    style={{
                                      gridColumnStart: col + 1,
                                      gridRow: 1,
                                      justifySelf: 'start',
                                      transform: 'translateX(-2px)',
                                    }}
                                    className="font-mono text-[11px] text-white/45 select-none"
                                  >
                                    {label}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Day labels + grid */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: `${LEFT_LABEL_W}px auto`,
                                columnGap: 8,
                                alignItems: 'start',
                              }}
                            >
                              {/* Day labels (left) */}
                              <div
                                aria-hidden="true"
                                style={{
                                  display: 'grid',
                                  gridTemplateRows: `repeat(7, ${CELL}px)`,
                                  rowGap: GAP,
                                  alignItems: 'center',
                                }}
                              >
                                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, idx) => (
                                  <div
                                    key={`${label}-${idx}`}
                                    className="font-mono text-[11px] text-white/40 select-none"
                                    style={{
                                      height: CELL,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'flex-end',
                                      paddingRight: 2,
                                    }}
                                  >
                                    {label}
                                  </div>
                                ))}
                              </div>

                              {/* Heatmap grid */}
                              <div
                                style={{
                                  display: 'grid',
                                  gridAutoFlow: 'column',
                                  gridAutoColumns: `${CELL}px`,
                                  gridTemplateRows: `repeat(7, ${CELL}px)`,
                                  gap: GAP,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                              >
                                {weeks.flatMap((week, wIdx) =>
                                  week.map((day, dIdx) => {
                                    const level = (day?.level ?? 0) as GhContribDay['level'];
                                    const fill = GH_DARK_GREENS[level];
                                    const title = day
                                      ? `${day.date}: ${day.count} contribution${day.count === 1 ? '' : 's'}`
                                      : '';
                                    return (
                                      <div
                                        key={`${wIdx}-${dIdx}`}
                                        title={title}
                                        style={{
                                          width: CELL,
                                          height: CELL,
                                          borderRadius: 2, // GitHub-ish rounded squares
                                          background: fill,
                                          position: 'relative',
                                          boxShadow:
                                            level === 0
                                              ? '0 0 0 0 rgba(255,255,255,0)'
                                              : '0 0 0 1px rgba(0,0,0,0.12) inset',
                                        }}
                                        className="outline outline-[0.5px] outline-transparent hover:outline-white/90 transition-[outline-color] duration-150"
                                      />
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div
                        aria-hidden="true"
                        className="mx-auto"
                        style={{
                          width: 'fit-content',
                          opacity: 0.35,
                          filter: 'blur(0px)',
                        }}
                      >
                        {(() => {
                          const CELL = 12;
                          const GAP = 3;
                          const LEFT_LABEL_W = 26;
                          return (
                            <div>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: `${LEFT_LABEL_W}px repeat(53, ${CELL}px)`,
                                  columnGap: GAP,
                                  marginBottom: 6,
                                }}
                              >
                                <div />
                                <div className="h-[12px]" />
                              </div>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: `${LEFT_LABEL_W}px auto`,
                                  columnGap: 8,
                                }}
                              >
                                <div />
                                <div
                                  style={{
                                    display: 'grid',
                                    gridAutoFlow: 'column',
                                    gridAutoColumns: `${CELL}px`,
                                    gridTemplateRows: `repeat(7, ${CELL}px)`,
                                    gap: GAP,
                                  }}
                                >
                                  {Array.from({ length: 53 * 7 }).map((_, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        width: CELL,
                                        height: CELL,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.06)',
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-10">
                  <a
                    href="http://www.github.com/leifchristian"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-white/90 hover:text-sky-300 focus-visible:text-sky-300 transition-colors drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)]"
                  >
                    <span className="inline-flex transform-gpu transition-transform duration-200 ease-out hover:scale-110 focus-visible:scale-110">
                      <Github size={52} />
                    </span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/leifchristian"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-white/90 hover:text-sky-300 focus-visible:text-sky-300 transition-colors drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)]"
                  >
                    <span className="inline-flex transform-gpu transition-transform duration-200 ease-out hover:scale-110 focus-visible:scale-110">
                      <Linkedin size={52} />
                    </span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;