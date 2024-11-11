import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

interface ThemeContextProps {
  toggleTheme: () => void;
  darkMode: boolean;
}

const ThemeContext = createContext<ThemeContextProps>({
  toggleTheme: () => {},
  darkMode: false,
});

export const useThemeContext = () => useContext(ThemeContext);

const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  // Load theme from localStorage on initial render
  useEffect(() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setDarkMode(parsedSettings.theme === 'dark');
    } else {
      // Initialize localStorage with dark mode as default
      localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));
    }
  }, []);

  // Update the theme in localStorage and on the <html> element when darkMode changes
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify({ theme: darkMode ? 'dark' : 'light' }));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
        },
      }),
    [darkMode]
  );

  return (
    <ThemeContext.Provider value={{ toggleTheme, darkMode }}>
      <MUIThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export default CustomThemeProvider;
