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
    }, 1500); // Reduced to match new animation duration

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
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-300 text-gray-800'}`}>
      <header className={`p-4 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-blue-100'}`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Portfolio</h1>
          <nav className="flex items-center">
            <Link to="/" className="mr-4">Home</Link>
            <Link to="/about" className="mr-4">About</Link>
            <Link to="/portfolio" className="mr-4">Portfolio</Link>
            <Link to="/contact" className="mr-4">Contact</Link>
            <button onClick={toggleTheme} className="focus:outline-none">
              {darkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-400" aria-label="Switch to Light Mode" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-500" aria-label="Switch to Dark Mode" />
              )}
            </button>
          </nav>
        </div>
      </header>
      <main className={`flex-grow container mx-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-300'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<ContactForm />} />
        </Routes>
      </main>
      <footer className="p-4 bg-gray-800 text-white text-center">
        © 2024 Leif Christian
      </footer>
    </div>
  );
};

export default App;