import { createContext, useContext } from "react";
import type { ThemeName } from "../../lib/task-state";
import { themes } from "../../lib/task-state";

const ThemeContext = createContext<ThemeName>("olive");

export function ThemeProvider({
  value,
  children
}: {
  value: ThemeName;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { themes };
