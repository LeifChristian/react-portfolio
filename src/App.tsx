import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './components/Home';
import ContactForm from './components/ContactForm'
import Portfolio from './components/Portfolio';
import { Setlist } from './components/Setlist';
import CustomThemeProvider, { useThemeContext } from './ThemeProvider';
// @ts-ignore
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { Github, Linkedin } from 'lucide-react';

const pageLoadStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }

  .page-wrapper {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .page-wrapper::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Neutral light canvas behind everything (main sets its own bg). */
    background-color: #f8fafc;
    z-index: -1;
  }

  @keyframes pageLoad {
    0% {
      transform: rotate3d(1, 1, 1, 0deg) translateZ(0);
      opacity: 0;
    }
    100% {
      transform: rotate3d(1, 1, 1, 360deg) translateZ(0);
      opacity: 1;
    }
  }

  .animate-page-load {
    animation: pageLoad 1.5s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    will-change: transform, opacity;
  }
`;

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = pageLoadStyles;
    document.head.appendChild(styleElement);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      styleElement.remove();
    };
  }, []);

  return (
    <CustomThemeProvider>
      <div className="page-wrapper">
        <div 
          className={`
            origin-center
            perspective-1000
            ${isLoading ? 'animate-page-load' : ''}
            flex-1 flex flex-col
          `}
          style={{
            transformOrigin: 'center center'
          }}
        >
          <Router>
            <MainContent />
          </Router>
        </div>
      </div>
    </CustomThemeProvider>
  );
}

const MainContent = () => {
  const { toggleTheme, darkMode } = useThemeContext();
  const location = useLocation();

  // Track previous path (available during render on route changes).
  const prevPathRef = useRef<string | null>(null);
  const prevPath = prevPathRef.current ?? undefined;
  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const hideFooterSocials =
    location.pathname === '/' &&
    typeof window !== 'undefined' &&
    sessionStorage.getItem('lc_home_intro_done_v1') === '1' &&
    prevPath === '/portfolio';

  return (
    <div className="h-screen flex flex-col">
      <header
        className={`sticky top-0 z-10 p-4 font-semibold ${
          darkMode
            ? 'bg-gray-800 text-white shadow-md'
            : 'bg-white/90 text-slate-900 backdrop-blur border-b border-slate-200 shadow-sm'
        }`}
      >
        <div className="container mx-auto relative flex items-center justify-center">
          <nav className="flex items-center justify-center gap-5 font-medium">
            <Link
              to="/"
              className={`transition-colors ${
                darkMode ? 'hover:text-sky-300' : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/portfolio"
              className={`transition-colors ${
                darkMode ? 'hover:text-sky-300' : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Portfolio
            </Link>
            <Link
              to="/contact"
              className={`transition-colors ${
                darkMode ? 'hover:text-sky-300' : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Contact
            </Link>
            <Link
              to="/setlist"
              className={`hidden transition-colors ${
                darkMode ? 'hover:text-sky-300' : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Setlist
            </Link>
          </nav>

          <button
            onClick={toggleTheme}
            className="absolute right-0 top-1/2 -translate-y-1/2 focus:outline-none"
          >
            {darkMode ? (
              <SunIcon className="w-6 h-6 text-yellow-400" aria-label="Switch to Light Mode" />
            ) : (
              <MoonIcon className="w-6 h-6 text-gray-500" aria-label="Switch to Dark Mode" />
            )}
          </button>
        </div>
      </header>

      <main
        className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}
            style={{ marginBottom: "60px" }}> 
        <div className="container mx-auto h-full min-h-full">
          <Routes>
            <Route path="/" element={<Home previousPath={prevPath} />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/setlist" element={<Setlist />} />
          </Routes>
        </div>
      </main>

      <footer
        className={`fixed bottom-0 left-0 right-0 text-center p-4 w-full z-50 ${
          darkMode
            ? 'bg-gray-800 text-white'
            : 'bg-white/90 text-slate-900 backdrop-blur border-t border-slate-200'
        }`}
      >
        <div className="flex items-center justify-center gap-4">
          <span>© 2026 Leif Christian</span>
          {!hideFooterSocials && (
            <div className="flex gap-3">
              <a 
                href="http://www.github.com/leifchristian" 
                target="_blank"
                rel="noopener noreferrer"
                className={`group transition-colors ${
                  darkMode ? 'hover:text-sky-300' : 'hover:text-blue-600'
                }`}
              >
                <Github 
                  size={24} 
                  className={`${
                    darkMode ? 'text-white group-hover:text-sky-300' : 'text-slate-900 group-hover:text-blue-600'
                  } transition-colors`}
                />
              </a>
              <a 
                href="https://www.linkedin.com/in/leifchristian" 
                target="_blank"
                rel="noopener noreferrer"
                className={`group transition-colors ${
                  darkMode ? 'hover:text-sky-300' : 'hover:text-blue-600'
                }`}
              >
                <Linkedin 
                  size={24} 
                  className={`${
                    darkMode ? 'text-white group-hover:text-sky-300' : 'text-slate-900 group-hover:text-blue-600'
                  } transition-colors`}
                />
              </a>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;