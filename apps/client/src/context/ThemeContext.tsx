import { createContext, useContext, useState, type ReactNode } from "react";

type ThemeContextValue = {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState(() => localStorage.getItem('jaynstan.theme') || 'luxury');

  const setTheme = (nextTheme: string) => {
    setThemeState(nextTheme);
    localStorage.setItem('jaynstan.theme', nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "luxury" ? "bumblebee" : "luxury");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
