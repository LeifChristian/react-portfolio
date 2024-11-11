import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './components/Home';
import { About } from './components/About';
import { Portfolio } from './components/Portfolio';
import CustomThemeProvider, { useThemeContext } from './ThemeProvider';
// @ts-ignore
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

function App() {
  return (
    <CustomThemeProvider>
      <Router>
        <MainContent />
      </Router>
    </CustomThemeProvider>
  );
}

const MainContent = () => {
  const { toggleTheme, darkMode } = useThemeContext();

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
      <header className={`p-4 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-blue-100'}`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Portfolio</h1>
          <nav className="flex items-center">
            <Link to="/" className="mr-4">Home</Link>
            <Link to="/about" className="mr-4">About</Link>
            <Link to="/portfolio" className="mr-4">Portfolio</Link>
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
      <main className={`flex-grow container mx-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/portfolio" element={<Portfolio />} />
        </Routes>
      </main>
      <footer className="p-4 bg-gray-800 text-white text-center">
        © 2024 Leif Christian
      </footer>
    </div>
  );
};

export default App;
