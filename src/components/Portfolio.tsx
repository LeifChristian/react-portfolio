import React, { useEffect, useMemo, useRef, useState } from 'react';
import PortfolioCard from './PortfolioCard';
import { portfolioData } from './portfolioData';
import { useLocation, useNavigate } from 'react-router-dom';

const Portfolio = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const cinematicFromHome = useMemo(
    () => Boolean((location.state as any)?.cinematic),
    [location.state]
  );
  // Start "black" immediately when cinematic, then fade away.
  const [isCinematicEnter, setIsCinematicEnter] = useState<boolean>(cinematicFromHome);
  const hasHandledCinematic = useRef(false);

  useEffect(() => {
    // Scroll everything to top
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (hasHandledCinematic.current) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!cinematicFromHome || prefersReducedMotion) return;

    hasHandledCinematic.current = true;

    // Next frame: fade overlay away.
    requestAnimationFrame(() => {
      setIsCinematicEnter(false);
    });

    // Clear history state after the fade begins so normal navigation doesn't retrigger.
    const clearStateTimer = window.setTimeout(() => {
      navigate('/portfolio', { replace: true, state: null });
    }, 1200);

    return () => {
      clearTimeout(clearStateTimer);
    };
  }, [cinematicFromHome, navigate]);

  const activeProject = portfolioData[Math.min(activeIdx, portfolioData.length - 1)];

  return (
    <div ref={mainRef} className="container mx-auto p-4">
      {/* Cinematic fade-in from black (only when coming from Home auto-redirect) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] bg-black transition-opacity"
        style={{
          opacity: isCinematicEnter ? 1 : 0,
          transitionDuration: '1100ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      />
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Portfolio</h1>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
          A small selection of recent work—kept intentionally minimal and resume-aligned.
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        {/* SkyFi-style tabs (titles visible for all projects) */}
        <div
          role="tablist"
          aria-label="Portfolio projects"
          className="mx-auto w-full max-w-4xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${portfolioData.length}, minmax(0, 1fr))`,
            alignItems: 'center',
          }}
        >
          {portfolioData.map((p, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={p.title}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIdx(idx)}
                className={`relative pt-1 text-center font-grotesk text-[13px] sm:text-[14px] font-semibold tracking-tight transition-colors ${
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>

        {/* Segmented underline rail (equal parts, with breaks between segments) */}
        <div
          aria-hidden="true"
          className="mx-auto mt-2 w-full max-w-4xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${portfolioData.length}, minmax(0, 1fr))`,
            columnGap: 18, // creates the "breaks" between segments
            alignItems: 'center',
          }}
        >
          {portfolioData.map((p, idx) => {
            const isActive = idx === activeIdx;
            return (
              <div key={`seg-${p.title}`} className="w-full">
                <div className="h-[2px] w-full rounded-full bg-black/15 dark:bg-white/15">
                  <div
                    className={`h-full w-full rounded-full transition-opacity ${
                      isActive ? 'opacity-100 bg-blue-600 dark:bg-sky-300' : 'opacity-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Active showcase */}
        <div className="mt-5 relative">
          <PortfolioCard {...activeProject} variant="showcase" showMeta={false} />

          {/* Nav dots (inside the card area, bottom-center) */}
          <div
            className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center justify-center gap-2"
            role="radiogroup"
            aria-label="Select project"
          >
            {portfolioData.map((p, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={`dot-${p.title}`}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={p.title}
                  onClick={() => setActiveIdx(idx)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-blue-600 dark:bg-sky-300 scale-110'
                      : 'bg-black/25 hover:bg-black/40 dark:bg-white/20 dark:hover:bg-white/35'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Description area */}
        <div className="mt-4 text-center">
          {activeProject.link ? (
            <a
              href={activeProject.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-semibold tracking-tight text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 no-underline"
            >
              {activeProject.title}
            </a>
          ) : (
            <div className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {activeProject.title}
            </div>
          )}

          {activeProject.stack && (
            <div className="mt-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/5 text-gray-700 dark:bg-white/10 dark:text-gray-200">
                {activeProject.stack}
              </span>
            </div>
          )}

          <p className="mt-3 mx-auto max-w-[80ch] text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {activeProject.description}
          </p>

          {/* (nav dots moved into the media card) */}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;