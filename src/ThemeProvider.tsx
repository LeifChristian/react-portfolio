import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';


interface ThemeContextProps {
  toggleTheme: () => void;
  darkMode: boolean;
  toggleAnimate: () => void;
  shouldAnimate: boolean;
}

const ThemeContext = createContext<ThemeContextProps>({
  toggleTheme: () => {},
  darkMode: false,
  toggleAnimate: () => {},
shouldAnimate: true
});



export const useThemeContext = () => useContext(ThemeContext);

const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize darkMode based on localStorage or default to true
  const initialDarkMode = (() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      return parsedSettings.theme === 'dark';
    }
    // Default to dark mode if no preference is saved
    localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));
    return true;
  })();

  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [shouldAnimate, setShouldAnimate] = useState(initialDarkMode);

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

  const toggleAnimate = () => {
    setShouldAnimate(prevState => !prevState);
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
    <ThemeContext.Provider value={{ toggleTheme, darkMode, toggleAnimate, shouldAnimate }}>
      <MUIThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export default CustomThemeProvider;
