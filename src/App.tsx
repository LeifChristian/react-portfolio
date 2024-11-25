import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './components/Home';
import { About } from './components/About';
import ContactForm from './components/ContactForm'
import Portfolio from './components/Portfolio';
import CustomThemeProvider, { useThemeContext } from './ThemeProvider';
// @ts-ignore
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

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
    background-color: grey;
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

  return (
    <div className="h-screen flex flex-col">
      <header className={`sticky top-0 z-10 p-4 font-bold shadow-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-blue-300'}`}>
        <div className="container mx-auto flex md:justify-between md:justify-between sm:justify-around items-center">

          <nav className="flex items-center">
            <Link to="/" className="mr-4">Home</Link>
            <Link to="/portfolio" className="mr-4">Portfolio</Link>
            <Link to="/contact" className="mr-4">Contact</Link>
            <button onClick={toggleTheme} className="focus:outline-none flex-end">
              {darkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-400" aria-label="Switch to Light Mode" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-500" aria-label="Switch to Dark Mode" />
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-300'}`}
            style={{ marginBottom: "60px" }}> {/* Height of footer */}
        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/contact" element={<ContactForm />} />
          </Routes>
        </div>
      </main>

      <footer className={`fixed bottom-0 left-0 right-0  text-center p-5 w-full z-50 ${darkMode ? 'bg-gray-800 text-white' : 'bg-blue-300 text-black'}`}>
        © 2024 Leif Christian |
        <a href="http://www.github.com/leifchristian" target='_blank' className='text-blue-400 hover:text-blue-200'>  Github</a>
      </footer>
    </div>
  );
};

export default App;