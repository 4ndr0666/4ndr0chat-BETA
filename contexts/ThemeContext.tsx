import React, { createContext, useState, useMemo, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => console.warn('no theme provider'),
});

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const localTheme = window.localStorage.getItem('theme') as Theme;
    if (localTheme) {
      setTheme(localTheme);
      document.body.className = localTheme;
    } else {
      document.body.className = 'dark';
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      window.localStorage.setItem('theme', newTheme);
      document.body.className = newTheme;
      return newTheme;
    });
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
        {children}
    </ThemeContext.Provider>
  );
};
